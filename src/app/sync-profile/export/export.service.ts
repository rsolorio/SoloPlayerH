import { Injectable } from '@angular/core';
import { IExportConfig, IExportResult } from './export.interface';
import { DatabaseEntitiesService } from '../../shared/services/database/database-entities.service';
import { DatabaseService, IColumnQuery, IResultsIteratorOptions } from '../../shared/services/database/database.service';
import { FilterEntity, PlaylistEntity, SongExportEntity, ValueListEntryEntity } from '../../shared/entities';
import { ISongExtendedModel, ISongModel } from '../../shared/models/song-model.interface';
import {
  SongExpExtendedByArtistViewEntity,
  SongExpExtendedByClassificationViewEntity,
  SongExpExtendedByPlaylistViewEntity,
  SongExpExtendedViewEntity,
  SongExtendedByArtistViewEntity,
  SongExtendedByClassificationViewEntity,
  SongExtendedByPlaylistViewEntity,
  SongExtendedViewEntity
} from '../../shared/entities/song-extended-view.entity';
import { Criteria, CriteriaItem } from '../../shared/services/criteria/criteria.class';
import { MetadataWriterService } from 'src/app/mapping/data-transform/metadata-writer.service';
import { PlaylistWriterService } from 'src/app/mapping/data-transform/playlist-writer.service';
import { KeyValueGen } from 'src/app/core/models/core.interface';
import { CriteriaComparison, CriteriaSortDirection } from '../../shared/services/criteria/criteria.enum';
import { ScriptParserService } from 'src/app/scripting/script-parser/script-parser.service';
import { ValueLists } from '../../shared/services/database/database.lists';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PeriodTimer } from 'src/app/core/models/timer.class';
import { EntityTarget, In } from 'typeorm';
import { SideBarMenuStateService } from 'src/app/core/components/side-bar-menu/side-bar-menu-state.service';
import { AppRoute } from 'src/app/app-routes';
import { Bytes } from 'src/app/core/services/utility/utility.enum';
import { FileService } from 'src/app/platform/file/file.service';
import { AppEvent } from 'src/app/app-events';
import { FilterTarget } from 'src/app/shared/models/music.enum';

enum SongViewType {
  Standard,
  Artist,
  Classification,
  Playlist
}

/**
 * Service to copy audio and playlist files to other locations.
 * The export service will: export audio files and playlists based on configuration.
 * The configuration will be associated to a sync profile record.
 * The export service will have the responsibility of getting the list of song records to process based on config.
 * It will use a file writer to copy and tag the audio file; the writer will be initialized with the profile id,
 * and probably with some more info (like the destination directory); it will load all data sources associated, in this case, only one, the Song Row data source;
 * the export service will iterate each song row, pass it to the writer which will get the metadata (KeyValues), and use it to create the file with the proper tags in the proper location;
 * the mappings in the SongRow data source will determine how the KeyValues object is used to save the tags.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private config: IExportConfig;
  private running: boolean;
  private syncFileName = 'SyncInfo.txt';
  constructor(
    private db: DatabaseService,
    private writer: MetadataWriterService,
    private playlistWriter: PlaylistWriterService,
    private parser: ScriptParserService,
    private entities: DatabaseEntitiesService,
    private events: EventsService,
    private sidebarMenuService: SideBarMenuStateService,
    private fileService: FileService,
    private utility: UtilityService) { }

  public get isRunning(): boolean {
    return this.running;
  }

  /**
   * Runs the export process in the following steps:
   * 1. Determine which songs will be exported
   * 2. Copy songs from the source to the destination
   * 3. Update songs metadata based on the database and mapping info
   * 4. Export filters (smartlists) as playlist files
   * 5. Export auto filters as playlist files
   * 6. Export playlists as playlist files
   */
  public async run(exportProfileId: string, configOverride?: IExportConfig): Promise<void> {
    this.running = true;
    this.sidebarMenuService.setRunning(AppRoute.Settings, true);
    this.events.broadcast(AppEvent.ExportStart);
    const t = new PeriodTimer(this.utility);
    // TODO: empty folder before running, or real sync add/replace/remove
    // In theory a writer should only have one data source
    const syncProfile = await this.entities.getSyncProfile(exportProfileId);
    if (configOverride) {
      if (configOverride.directories?.length) {
        syncProfile.directoryArray = configOverride.directories;
      }
      syncProfile.configObj = Object.assign(syncProfile.configObj ? syncProfile.configObj : {}, configOverride);
    }
    syncProfile.configObj.playlistConfig = syncProfile.configObj.playlistConfig ? syncProfile.configObj.playlistConfig : {};
    this.config = syncProfile.configObj;
    
    // Cache for getting classification data which will be used by the data source
    syncProfile.nonPrimaryRelations = await this.entities.getNonPrimaryRelations();
    syncProfile.classifications = await ValueListEntryEntity.findBy({ isClassification: true });

    const dataSources = await this.entities.getDataSources(syncProfile.id);
    await this.writer.init(syncProfile, dataSources);
    await this.prepareSongs();
    this.sortSongs();

    const exportResult: IExportResult = {
      rootPath: syncProfile.directoryArray[0],
      playlistFolder: this.config?.playlistConfig ? this.config.playlistConfig.dedicatedDirectoryName : null,
      totalFileCount: this.config.songs.length,
      finalFileCount: 0,
      smartlistCount: 0,
      autolistCount: 0,
      playlistCount: 0
    };

    // EXPORT SONG FILES
    let bytes = 0;
    let seconds = 0;
    this.config.playlistConfig.fileMappings = {};
    for (const song of this.config.songs) {
      this.events.broadcast(AppEvent.ExportAudioFileStart, exportResult);
      // This process must return a mapping between the original path and the new path
      const writeResult = await this.writer.run(song);
      this.config.playlistConfig.fileMappings[writeResult.sourcePath] = writeResult.destinationPath;
      // Files skipped during the writer process will be ignored in the calculation
      if (!writeResult.skipped) {
        bytes += song.fileSize;
        seconds += song.seconds;
        exportResult.finalFileCount++;
        writeResult.count = exportResult.finalFileCount;
        this.events.broadcast(AppEvent.ExportAudioFileEnd, writeResult);
      }
    }
    // Set the calculations
    exportResult.size = this.utility.round(this.utility.bytesTo(bytes, Bytes.Gigabyte), 2).toString() + 'Gb';
    exportResult.length = this.utility.secondsToHours(seconds);

    // EXPORT PLAYLIST FILES
    await this.playlistWriter.init(syncProfile, null);

    if (!this.config.playlistConfig.smartlistsDisabled) {
      this.events.broadcast(AppEvent.ExportSmartlistsStart, exportResult);
      exportResult.smartlistCount = await this.exportFilters();
    }
    if (!this.config.playlistConfig.autolistsDisabled) {
      this.events.broadcast(AppEvent.ExportAutolistsStart, exportResult);
      exportResult.autolistCount = await this.exportAutolists();
    }
    if (!this.config.playlistConfig.playlistsDisabled && !this.config.exportTableEnabled) {
      // Exporting all playlist entities is not supported if only a subset of the songs is being used
      this.events.broadcast(AppEvent.ExportPlaylistsStart, exportResult);
      exportResult.playlistCount = await this.exportPlaylists();
    }
    else if (this.config.playlistConfig?.ids?.length) {
      // But if specific playlists were specified, then only export those
      this.events.broadcast(AppEvent.ExportPlaylistsStart, exportResult);
      exportResult.playlistCount = await this.exportPlaylists(this.config.playlistConfig.ids);
    }
    await this.clearSongExport();
    exportResult.period = t.stop();
    await this.saveSyncFile(exportResult);
    this.events.broadcast(AppEvent.ExportEnd, exportResult);
    // TODO: cleanup the Export Song table, since it was just needed for this process
    this.sidebarMenuService.setRunning(AppRoute.Settings, false);
    this.running = false;
  }

  /**
   * Sets up the songs in the config object based on the specified criteria and fills the SongExport table if needed.
   */
  private async prepareSongs(): Promise<void> {
    // Let's make sure export is not enabled to get songs from the real tables
    this.config.exportTableEnabled = false;

    if (this.config.playlistConfig?.ids?.length) {
      const criteria = new Criteria();
      criteria.searchCriteria.addIgnore('sequence');
      const criteriaItem = criteria.searchCriteria.addIgnore('playlistId');
      criteriaItem.comparison = CriteriaComparison.Equals;
      for (const playlistId of this.config.playlistConfig.ids) {
        criteriaItem.columnValues.push({ value: playlistId });
      }
      await this.mergeCriteria(criteria);
    }
    if (this.config.filterId) {
      const filter = await FilterEntity.findOneBy({ id: this.config.filterId });
      const criteria = await this.entities.getCriteriaFromFilter(filter);
      await this.mergeCriteria(criteria);
    }
    if (this.config.lastAdded) {
      const criteria = new Criteria('Last Added');
      criteria.paging.pageSize = this.config.lastAdded;
      criteria.addSorting('addDate', CriteriaSortDirection.Descending);
      await this.mergeCriteria(criteria);
    }

    if (this.config.criteria) {
      await this.mergeCriteria(this.config.criteria);
    }

    if (this.config.songs) {
      // Songs at this point must be moved to the export table
      // so other criteria filters can apply only to this subset
      await this.fillSongExport(this.config.songs);
      // Now tell the queries to get data from the export table
      this.config.exportTableEnabled = true;
      // WE STOP HERE
      return;
    }

    // Send all songs
    this.config.songs = await SongExtendedViewEntity.find();
  }

  /**
   * Sorts the songs to be exported by filePath.
   * The sorting doesn't really affect the end result,
   * it is just to display the songs being exported in some order.
   */
  private sortSongs(): void {
    this.config.songs = this.utility.sort(this.config.songs, 'filePath');
  }

  /**
   * The songs retrieved by the specified criteria will be added to the config.songs list.
   * @param criteria Criteria to generate a list of songs.
   */
  private async mergeCriteria(criteria: Criteria): Promise<void> {
    const songs = await this.getSongs(criteria);
    if (this.config.songs?.length) {
      this.mergeSongs(songs, this.config.songs);
    }
    else {
      this.config.songs = songs;
    }
  }

  /**
   * Adds all source songs to the destination without duplicating songs.
   * @param source The list of songs to add to the destination.
   * @param destination An existing list of songs that will be updated with more songs.
   */
  private mergeSongs(source: ISongExtendedModel[], destination: ISongExtendedModel[]): void {
    for (const song of source) {
      if (!destination.find(s => s.id === song.id)) {
        destination.push(song);
      }
    }
  }

  private async fillSongExport(songs: ISongModel[]): Promise<void> {
    await this.clearSongExport();
    const songTempData: SongExportEntity[] = [];
    for (const song of songs) {
      const songTemp = this.db.mapEntities(song, SongExportEntity);
      songTempData.push(songTemp);
    }
    await this.db.bulkInsert(SongExportEntity, songTempData);
  }

  private async clearSongExport(): Promise<void> {
    await SongExportEntity.clear();
  }

  private async exportPlaylists(ids?: string[]): Promise<number> {
    let result = 0;
    let playlists: PlaylistEntity[];
    if (ids?.length) {
      playlists = await PlaylistEntity.findBy({ id: In(ids) });
    }
    else {
      playlists = await PlaylistEntity.find();
    }
    for (const playlist of playlists) {
      const criteria = new Criteria(playlist.name);
      criteria.searchCriteria.push(new CriteriaItem('playlistId', playlist.id));
      criteria.addSorting('sequence');
      const playlistCreated = await this.exportCriteriaAsPlaylist('#List', criteria);
      if (playlistCreated) {
        result++;
      }
    }
    return result;
  }

  private async exportFilters(): Promise<number> {
    let result = 0;
    const filters = await FilterEntity.find();
    for (const filter of filters) {
      // TODO: do this comparison with a criteria object and the database service
      if (filter.sync && filter.target === FilterTarget.Song) {
        const criteria = await this.entities.getCriteriaFromFilter(filter);
        const playlistExported = await this.exportCriteriaAsPlaylist('#Filter', criteria);
        if (playlistExported) {
          result++;
        }
      }
    }
    return result;
  }

  private async getSongs(criteria: Criteria): Promise<ISongExtendedModel[]> {
    if (criteria.hasComparison(false, 'classificationId')) {
      return this.db.getList(this.getSongViewEntity(SongViewType.Classification), criteria);
    }
    if (criteria.hasComparison(false, 'artistId')) {
      return this.db.getList(this.getSongViewEntity(SongViewType.Artist), criteria);
    }
    if (criteria.hasComparison(false, 'playlistId')) {
      return this.db.getList(this.getSongViewEntity(SongViewType.Playlist), criteria);
    }
    return this.db.getList(this.getSongViewEntity(SongViewType.Standard), criteria);
  }

  /**
   * Uses the specified criteria to get a list of songs which will be exported as a playlist file.
   */
  private async exportCriteriaAsPlaylist(namePrefix: string, criteria: Criteria): Promise<boolean> {
    if (this.config.playlistConfig?.maxCount && criteria.paging.pageSize) {
      // Override the number of tracks for each playlist
      // only if the configuration is less than the filter limit
      // We only want to ensure the playlist track limit does not go beyond the max specified by the user.
      // In theory this is not needed since the playlist writer performs
      // a slice on the filter result based on the max and min configs
      // but this will help getting only the data that is needed.
      if (this.config.playlistConfig.maxCount < criteria.paging.pageSize) {
        criteria.paging.pageSize = this.config.playlistConfig.maxCount;
      }
    }
    let tracks = await this.getSongs(criteria);
    if (tracks?.length) {
      return this.processPlaylist(tracks, criteria, namePrefix);
    }
    return false;
  }

  /**
   * Exports pre-defined criteria as playlist files.
   */
  private async exportAutolists(): Promise<number> {
    let result = 0;
    // These playlists can be configured in the database
    result += await this.exportIteratorPlaylists();
    // These playlists can only be implemented in code
    result += await this.exportHardcodedPlaylists();
    return result;
  }

  private async exportIteratorPlaylists(): Promise<number> {
    let result = 0;
    //await this.createDecadeByLanguagePlaylists();
    result += await this.createAddYearPlaylists();
    result += await this.createBestByDecadePlaylists();
    result += await this.createMoodPlaylists();
    return result;
  }

  private async exportHardcodedPlaylists(): Promise<number> {
    let result = 0;
    result += await this.createRandomPlaylists();
    // TODO: use the value list table to get the list of types
    result += await this.createClassificationTypePlaylists('#Subgenre', ValueLists.Subgenre.id);
    result += await this.createClassificationTypePlaylists('#Instrument', ValueLists.Instrument.id);
    result += await this.createClassificationTypePlaylists('#Category', ValueLists.Category.id);
    result += await this.createClassificationTypePlaylists('#Occasion', ValueLists.Occasion.id);
    return result;
  }

  private createDecadeByLanguagePlaylists(): Promise<number> {
    const decadeCriteria = new Criteria();
    decadeCriteria.paging.distinct = true;
    decadeCriteria.searchCriteria.push(new CriteriaItem('releaseDecade', 0, CriteriaComparison.NotEquals));

    const languageCriteria = new Criteria();
    languageCriteria.paging.distinct = true;

    return this.createIteratorPlaylists([
      { criteria: decadeCriteria, columnExpression: { expression: 'releaseDecade' } },
      { criteria: languageCriteria, columnExpression: { expression: 'language' } }],
      '%releaseDecade%\'s', '%language%');
  }

  private createAddYearPlaylists(): Promise<number> {
    const criteria = new Criteria();
    criteria.paging.distinct = true;
    const columnQuery: IColumnQuery = { criteria: criteria, columnExpression: { expression: 'addYear' }};
    return this.createIteratorPlaylists([columnQuery], '#Added', '%addYear%');
  }

  private createBestByDecadePlaylists(): Promise<number> {
    const valuesCriteria = new Criteria();
    valuesCriteria.paging.distinct = true;
    const columnQuery: IColumnQuery = { criteria: valuesCriteria, columnExpression: { expression: 'releaseDecade' }};
    const extraCriteriaItem = new CriteriaItem('rating', 5);
    return this.createIteratorPlaylists([columnQuery], '#Best', '%releaseDecade%\'s', false, [extraCriteriaItem]);
  }

  private createMoodPlaylists(): Promise<number> {
    const valuesCriteria = new Criteria();
    // Let's do this to have a different playlist every time.
    valuesCriteria.paging.distinct = true;
    valuesCriteria.searchCriteria.push(new CriteriaItem('mood', 'Unknown', CriteriaComparison.NotEquals));
    const columnQuery: IColumnQuery = { criteria: valuesCriteria, columnExpression: { expression: 'mood' }};
    return this.createIteratorPlaylists([columnQuery], '#Mood', '%mood%', true);
  }

  private async createClassificationTypePlaylists(prefix: string, classificationTypeId: string): Promise<number> {
    let result = 0;
    const classifications = await ValueListEntryEntity.findBy({ valueListTypeId: classificationTypeId });
    for (const classification of classifications) {
      const playlistProcessed = await this.createClassificationPlaylist(prefix, classification.name, classification.id);
      if (playlistProcessed) {
        result++;
      }
    }
    return result;
  }

  private createClassificationPlaylist(prefix: string, playlistName: string, classificationId: string): Promise<boolean> {
    const criteria = new Criteria(playlistName);
    // Let's do this to have a different playlist every time.
    criteria.random = true;
    criteria.paging.distinct = true;
    const criteriaItem = new CriteriaItem('classificationId', classificationId);
    criteriaItem.ignoreInSelect = true;
    criteria.searchCriteria.push(criteriaItem);
    return this.exportCriteriaAsPlaylist(prefix, criteria);
  }

  /**
   * It will create a playlist for each value returned by the prefix expression.
   * @param queries Queries used to get the list of values.
   * @param prefixExpression Script expression to be used as prefix in the name of the playlist file.
   * @param nameExpression Script expression to be used in the name of the playlist file.
   * @param extraCriteria Additional criteria to be used when getting the final list of results.
   * @returns The number of playlists created in the process.
   */
  private async createIteratorPlaylists(queries: IColumnQuery[], prefixExpression: string, nameExpression: string, random?: boolean, extraCriteria?: CriteriaItem[]): Promise<number> {
    let result = 0;
    const options: IResultsIteratorOptions<any> = {
      entity: this.getSongViewEntity(SongViewType.Standard),
      queries: queries,
      random: random,
      extraCriteria: extraCriteria,
      onResult: async (valuesObj: KeyValueGen<any>, items: any[]) => {
        if (items?.length) {
          const playlistPrefix = this.parser.parse({ expression: prefixExpression, context: valuesObj });
          const playlistName = this.parser.parse({ expression: nameExpression, context: valuesObj });
          const playlistProcessed = await this.processPlaylist(items, new Criteria(playlistName), playlistPrefix);
          if (playlistProcessed) {
            result++;
          }
        }
      }
    };
    await this.db.searchResultsIterator(options);
    return result;
  }

  private async processPlaylist(tracks: ISongExtendedModel[], criteria: Criteria, prefix: string): Promise<boolean> {
    const input: IExportConfig = {
      criteria: criteria, // The criteria here is only for passing the name of the playlist
      songs: tracks,
      playlistConfig: this.config.playlistConfig // This passes the general configuration
    };
    input.playlistConfig.prefix = prefix; // We override the prefix
    return this.playlistWriter.run(input);
  }

  /**
   * Creates 200 item playlists with unplayed songs with no mood and rating less than 4.
   */
  private async createRandomPlaylists(): Promise<number> {
    let result = 0;
    // Number of songs to be retrieved by the query
    const totalSongCount = 1000;
    // How long each playlist will be
    const playlistSongCount = 200;

    const criteria = new Criteria();
    criteria.paging.pageSize = totalSongCount;
    criteria.random = true;

    criteria.searchCriteria.push(new CriteriaItem('rating', 4, CriteriaComparison.LessThan));
    criteria.searchCriteria.push(new CriteriaItem('playCount', 0));
    criteria.searchCriteria.push(new CriteriaItem('mood', 'Unknown'));

    const tracks = await this.db.getList(this.getSongViewEntity(SongViewType.Standard), criteria);
    let playlistIndex = 0;
    while (tracks.length) {
      playlistIndex++;
      const subset = tracks.splice(0, playlistSongCount);
      const playlistCreated = await this.processPlaylist(subset, new Criteria(`Unplayed ${playlistIndex}`), '#Random');
      if (playlistCreated) {
        result++;
      }
    }

    return result;
  }

  private getSongViewEntity(viewType: SongViewType): EntityTarget<any> {
    switch (viewType) {
      case SongViewType.Standard:
        if (this.config.exportTableEnabled) {
          return SongExpExtendedViewEntity;
        }
        return SongExtendedViewEntity;
      case SongViewType.Artist:
        if (this.config.exportTableEnabled) {
          return SongExpExtendedByArtistViewEntity;
        }
        return SongExtendedByArtistViewEntity;
      case SongViewType.Classification:
        if (this.config.exportTableEnabled) {
          return SongExpExtendedByClassificationViewEntity;
        }
        return SongExtendedByClassificationViewEntity;
      case SongViewType.Playlist:
        if (this.config.exportTableEnabled) {
          return SongExpExtendedByPlaylistViewEntity;
        }
        return SongExtendedByPlaylistViewEntity;
    }
    return null;
  }

  private async saveSyncFile(result: IExportResult): Promise<void> {
    const filePath = this.fileService.combine(result.rootPath, this.syncFileName);
    let fileContent = JSON.stringify(result, null, 2);
    fileContent += '\n--------------------------------------------------\n'
    await this.fileService.appendText(filePath, fileContent);
  }
}
