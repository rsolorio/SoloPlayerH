import { Injectable } from '@angular/core';
import { IExportConfig } from './export.interface';
import { DatabaseEntitiesService } from '../database/database-entities.service';
import { DatabaseService, IColumnQuery, IResultsIteratorOptions } from '../database/database.service';
import { FilterEntity, PlaylistEntity, SongExportEntity, SongViewEntity, ValueListEntryEntity } from '../../entities';
import { ISongExtendedModel, ISongModel } from '../../models/song-model.interface';
import {
  SongExpExtendedByArtistViewEntity,
  SongExpExtendedByClassificationViewEntity,
  SongExpExtendedByPlaylistViewEntity,
  SongExpExtendedViewEntity,
  SongExtendedByArtistViewEntity,
  SongExtendedByClassificationViewEntity,
  SongExtendedByPlaylistViewEntity,
  SongExtendedViewEntity
} from '../../entities/song-extended-view.entity';
import { Criteria, CriteriaItem } from '../criteria/criteria.class';
import { MetadataWriterService } from 'src/app/mapping/data-transform/metadata-writer.service';
import { PlaylistWriterService } from 'src/app/mapping/data-transform/playlist-writer.service';
import { KeyValueGen } from 'src/app/core/models/core.interface';
import { CriteriaComparison, CriteriaSortDirection } from '../criteria/criteria.enum';
import { ScriptParserService } from 'src/app/scripting/script-parser/script-parser.service';
import { ValueLists } from '../database/database.lists';

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
  constructor(
    private db: DatabaseService,
    private writer: MetadataWriterService,
    private playlistWriter: PlaylistWriterService,
    private parser: ScriptParserService,
    private entities: DatabaseEntitiesService) { }

  /**
   * Runs the export process in the following steps:
   * 1. Determine which songs will be exported
   * 2. Copy songs from the source to the destination
   * 3. Update songs metadata based on the database and mapping info
   * 4. Export filters as playlist files
   * 5. Export auto filters as playlist files
   * 6. Export playlists as playlist files
   */
  public async run(exportProfileId: string, configOverride?: IExportConfig): Promise<void> {
    // TODO: empty folder before running, or real sync add/replace/remove
    // TODO: flat structure
    // TODO: report progress / fire events
    // In theory a writer should only have one data source
    const syncProfile = await this.entities.getSyncProfile(exportProfileId);
    if (configOverride) {
      syncProfile.directories = configOverride.directories;
      syncProfile.config = Object.assign(syncProfile.config ? syncProfile.config : {}, configOverride);
    }
    syncProfile.config.playlistConfig = syncProfile.config.playlistConfig ? syncProfile.config.playlistConfig : {};
    this.config = syncProfile.config;
    
    // Cache for getting classification data which will be used by the data source
    syncProfile.nonPrimaryRelations = await this.entities.getNonPrimaryRelations();
    syncProfile.classifications = await ValueListEntryEntity.findBy({ isClassification: true });

    await this.writer.init(syncProfile);
    await this.prepareSongs();

    // EXPORT TO SONG FILES
    this.config.playlistConfig.fileMappings = {};
    for (const song of this.config.songs) {
      // This process must return a mapping between the original path and the new path
      const result = await this.writer.process(song);
      this.config.playlistConfig.fileMappings[result.sourcePath] = result.destinationPath;
    }

    // EXPORT TO PLAYLIST FILES
    await this.playlistWriter.init(syncProfile);

    if (!this.config.playlistConfig.smartlistsDisabled) {
      await this.exportFilters();
    }
    if (!this.config.playlistConfig.autolistsDisabled) {
      await this.exportAutolists();
    }
    if (!this.config.playlistConfig.playlistsDisabled && !this.config.songExportEnabled) {
      // Exporting playlist entities is not supported if only a subset of the songs is being used
      await this.exportPlaylists();
    }

    // TODO: cleanup the Export Song table, since it was just needed for this process
  }

  /**
   * Sets up the songs in the config object based on the specified criteria and fills the SongExport table if needed.
   */
  private async prepareSongs(): Promise<void> {
    if (!this.config.songs) {
      if (this.config.playlistId && !this.config.criteria) {
        this.config.criteria = new Criteria('Playlist Search');
        this.config.criteria.searchCriteria.push(new CriteriaItem('playlistId', this.config.playlistId));
      }
      if (this.config.filterId && !this.config.criteria) {
        const filter = await FilterEntity.findOneBy({ id: this.config.filterId });
        this.config.criteria = await this.entities.getCriteriaFromFilter(filter);
      }
      if (this.config.lastAddedCount && !this.config.criteria) {
        this.config.criteria = new Criteria('Last Added');
        this.config.criteria.paging.pageSize = this.config.lastAddedCount;
        this.config.criteria.addSorting('addDate', CriteriaSortDirection.Descending);
      }

      if (this.config.criteria) {
        if (this.config.criteria.hasComparison(false, 'playlistId')) {
          this.config.songs = await this.db.getList(SongExtendedByPlaylistViewEntity, this.config.criteria);
        }
        else if (this.config.criteria.hasComparison(false, 'classificationId')) {
          this.config.songs = await this.db.getList(SongExtendedByClassificationViewEntity, this.config.criteria);
        }
        else if (this.config.criteria.hasComparison(false, 'artistId')) {
          this.config.songs = await this.db.getList(SongExtendedByArtistViewEntity, this.config.criteria);
        }
        else {
          this.config.songs = await this.db.getList(SongExtendedViewEntity, this.config.criteria);
        }
      }
    }

    if (this.config.songs) {
      // Songs at this point must be moved to the export table
      // so other criteria filters can apply only to this subset
      await this.fillSongExport(this.config.songs);
      this.config.songExportEnabled = true;
      return;
    }

    // Send all songs
    this.config.songs = await SongExtendedViewEntity.find();
  }

  private async fillSongExport(songs: ISongModel[]): Promise<void> {
    await SongExportEntity.clear();
    const songTempData: SongExportEntity[] = [];
    for (const song of songs) {
      const songTemp = this.db.mapEntities(song, SongExportEntity);
      songTempData.push(songTemp);
    }
    await this.db.bulkInsert(SongExportEntity, songTempData);
  }

  private async exportPlaylists(): Promise<void> {
    const playlists = await PlaylistEntity.find();
    for (const playlist of playlists) {
      const criteria = new Criteria(playlist.name);
      criteria.searchCriteria.push(new CriteriaItem('playlistId', playlist.id));
      criteria.addSorting('sequence');
      await this.exportCriteriaAsPlaylist('List', criteria, this.config.songExportEnabled);
    }
  }

  private async exportFilters(): Promise<void> {
    const filters = await FilterEntity.find();
    for (const filter of filters) {
      const criteria = await this.entities.getCriteriaFromFilter(filter);
      await this.exportCriteriaAsPlaylist('Filter', criteria, this.config.songExportEnabled);
    }
  }

  /**
   * Uses the specified criteria to get a list of songs which will be exported as a playlist file.
   */
  private async exportCriteriaAsPlaylist(namePrefix: string, criteria: Criteria, isSubset: boolean): Promise<void> {
    // Override the number of results with the max number of tracks
    if (this.config.playlistConfig?.maxCount) {
      criteria.paging.pageSize = this.config.playlistConfig.maxCount;
    }
    let tracks: ISongExtendedModel[];
    if (criteria.hasComparison(false, 'classificationId')) {
      tracks = await this.db.getList(
        isSubset ? SongExpExtendedByClassificationViewEntity : SongExtendedByClassificationViewEntity, criteria);
    }
    else if (criteria.hasComparison(false, 'artistId')) {
      tracks = await this.db.getList(
        isSubset ? SongExpExtendedByArtistViewEntity : SongExtendedByArtistViewEntity, criteria);
    }
    else if (criteria.hasComparison(false, 'playlistId')) {
      // In theory, playlists should only exported if all songs are being exported (isSubset=false),
      // but we are supporting filtering by playlistId in both cases just in case
      tracks = await this.db.getList(
        isSubset ? SongExpExtendedByPlaylistViewEntity : SongExtendedByPlaylistViewEntity, criteria);
    }
    else {
      tracks = await this.db.getList(
        isSubset ? SongExpExtendedViewEntity : SongExtendedViewEntity, criteria);
    }
    if (tracks?.length) {
      await this.processPlaylist(tracks, criteria, namePrefix);
    }
  }

  /**
   * Exports pre-defined criteria as playlist files.
   */
  private async exportAutolists(): Promise<void> {
    // These playlists can be configured in the database
    await this.exportIteratorPlaylists();
    // These playlists can only be implemented in code
    await this.exportHardcodedPlaylists();
  }

  private async exportIteratorPlaylists(): Promise<void> {
    //await this.createDecadeByLanguagePlaylists();
    await this.createAddYearPlaylists();
    await this.createBestByDecadePlaylists();
    await this.createMoodPlaylists();
  }

  private async exportHardcodedPlaylists(): Promise<void> {
    await this.createRandomPlaylists();
    // TODO: use the value list table to get the list of types
    await this.createClassificationTypePlaylists('Subgenre', ValueLists.Subgenre.id);
    await this.createClassificationTypePlaylists('Instrument', ValueLists.Instrument.id);
    await this.createClassificationTypePlaylists('Category', ValueLists.Category.id);
    await this.createClassificationTypePlaylists('Occasion', ValueLists.Occasion.id);
  }

  private async createDecadeByLanguagePlaylists(): Promise<void> {
    const decadeCriteria = new Criteria();
    decadeCriteria.paging.distinct = true;
    decadeCriteria.searchCriteria.push(new CriteriaItem('releaseDecade', 0, CriteriaComparison.NotEquals));

    const languageCriteria = new Criteria();
    languageCriteria.paging.distinct = true;

    await this.createIteratorPlaylists([
      { criteria: decadeCriteria, columnExpression: { expression: 'releaseDecade' } },
      { criteria: languageCriteria, columnExpression: { expression: 'language' } }],
      '%releaseDecade%\'s', '%language%');
  }

  private async createAddYearPlaylists(): Promise<void> {
    const criteria = new Criteria();
    criteria.paging.distinct = true;
    const columnQuery: IColumnQuery = { criteria: criteria, columnExpression: { expression: 'addYear' }};
    await this.createIteratorPlaylists([columnQuery], 'Added', '%addYear%');
  }

  private async createBestByDecadePlaylists(): Promise<void> {
    const valuesCriteria = new Criteria();
    valuesCriteria.paging.distinct = true;
    const columnQuery: IColumnQuery = { criteria: valuesCriteria, columnExpression: { expression: 'releaseDecade' }};
    const extraCriteriaItem = new CriteriaItem('rating', 5);
    await this.createIteratorPlaylists([columnQuery], 'Best', '%releaseDecade%\'s', [extraCriteriaItem]);
  }

  private async createMoodPlaylists(): Promise<void> {
    const valuesCriteria = new Criteria();
    valuesCriteria.paging.distinct = true;
    valuesCriteria.searchCriteria.push(new CriteriaItem('mood', 'Unknown', CriteriaComparison.NotEquals));
    const columnQuery: IColumnQuery = { criteria: valuesCriteria, columnExpression: { expression: 'mood' }};
    await this.createIteratorPlaylists([columnQuery], 'Mood', '%mood%');
  }

  private async createClassificationTypePlaylists(prefix: string, classificationTypeId: string): Promise<void> {
    const classifications = await ValueListEntryEntity.findBy({ valueListTypeId: classificationTypeId });
    for (const classification of classifications) {
      await this.createClassificationPlaylists(prefix, classification.name, classification.id);
    }
  }

  private async createClassificationPlaylists(prefix: string, playlistName: string, classificationId: string): Promise<void> {
    const criteria = new Criteria(playlistName);
    criteria.paging.distinct = true;
    const criteriaItem = new CriteriaItem('classificationId', classificationId);
    criteriaItem.ignoreInSelect = true;
    criteria.searchCriteria.push(criteriaItem);
    await this.exportCriteriaAsPlaylist(prefix, criteria, this.config.songExportEnabled);
  }

  private async createIteratorPlaylists(queries: IColumnQuery[], prefixExpression: string, nameExpression: string, extraCriteria?: CriteriaItem[]): Promise<void> {
    const options: IResultsIteratorOptions<SongExtendedViewEntity> = {
      entity: SongExtendedViewEntity,
      queries: queries,
      extraCriteria: extraCriteria,
      onResult: async (valuesObj: KeyValueGen<any>, items: SongExtendedViewEntity[]) => {
        if (items?.length) {
          const playlistPrefix = this.parser.parse({ expression: prefixExpression, context: valuesObj });
          const playlistName = this.parser.parse({ expression: nameExpression, context: valuesObj });
          await this.processPlaylist(items, new Criteria(playlistName), playlistPrefix);
        }
      }
    };
    await this.db.searchResultsIterator(options);
  }

  private async processPlaylist(tracks: ISongExtendedModel[], criteria: Criteria, prefix: string): Promise<void> {
    const input: IExportConfig = {
      criteria: criteria, // The criteria here is only for passing the name of the playlist
      songs: tracks,
      playlistConfig: this.config.playlistConfig // This passes the general configuration
    };
    input.playlistConfig.prefix = prefix; // We override the prefix
    await this.playlistWriter.process(input);
  }

  private async createRandomPlaylists(): Promise<void> {
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

    const tracks = await this.db.getList(SongExtendedViewEntity, criteria);
    let playlistIndex = 0;
    while (tracks.length) {
      playlistIndex++;
      const subset = tracks.splice(0, playlistSongCount);
      await this.processPlaylist(subset, new Criteria(`Unplayed #${playlistIndex}`), 'Random');
    }
  }
}
