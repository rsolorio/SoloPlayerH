import { Injectable } from '@angular/core';
import { IExportConfig } from './export.interface';
import { DatabaseEntitiesService } from '../database/database-entities.service';
import { DatabaseService, IResultsIteratorOptions } from '../database/database.service';
import { FilterEntity, PlaylistEntity, SongExportEntity, ValueListEntryEntity } from '../../entities';
import { ISongExtendedModel, ISongModel } from '../../models/song-model.interface';
import { SyncProfileId } from '../database/database.seed';
import {
  SongExpExtendedByArtistViewEntity,
  SongExpExtendedByClassificationViewEntity,
  SongExpExtendedViewEntity,
  SongExtendedByArtistViewEntity,
  SongExtendedByClassificationViewEntity,
  SongExtendedByPlaylistViewEntity,
  SongExtendedViewEntity
} from '../../entities/song-extended-view.entity';
import { Criteria, CriteriaItem } from '../criteria/criteria.class';
import { MetadataWriterService } from 'src/app/mapping/data-transform/metadata-writer.service';
import { PlaylistWriterService } from 'src/app/mapping/data-transform/playlist-writer.service';
import { KeyValueGen, KeyValues } from 'src/app/core/models/core.interface';
import { CriteriaComparison } from '../criteria/criteria.enum';

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
  public async run(configOverride?: IExportConfig): Promise<void> {
    // TODO: empty folder before running, or real sync add/replace/remove
    // TODO: Max songs to export in each playlist
    // TODO: flat structure
    // TODO: report progress / fire events
    // In theory a writer should only have one data source
    const syncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultExport);
    if (configOverride) {
      syncProfile.directories = configOverride.directories;
      syncProfile.config = Object.assign(syncProfile ? syncProfile : {}, configOverride);
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
      this.exportCriteriaAsPlaylist('List', criteria, this.config.songExportEnabled);
    }
  }

  private async exportFilters(): Promise<void> {
    const filters = await FilterEntity.find();
    for (const filter of filters) {
      const criteria = await this.entities.getCriteriaFromFilter(filter);
      this.exportCriteriaAsPlaylist('Filter', criteria, this.config.songExportEnabled);
    }
  }

  private async exportCriteriaAsPlaylist(namePrefix: string, criteria: Criteria, isSubset: boolean): Promise<void> {
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
      tracks = await this.db.getList(
        isSubset ? SongExtendedByPlaylistViewEntity : SongExtendedViewEntity, criteria);
    }
    else {
      tracks = await this.db.getList(
        isSubset ? SongExpExtendedViewEntity : SongExtendedViewEntity, criteria);
    }
    if (tracks?.length) {
      // This config is only for passing the playlist name and the tracks
      const input: IExportConfig = {
        profileId: '',
        criteria: criteria,
        songs: tracks,
        playlistConfig: this.config.playlistConfig
      };
      input.playlistConfig.playlistPrefix = namePrefix;
      await this.playlistWriter.process(input);
    }
  }

  private async exportAutolists(): Promise<void> {
    await this.createDecadeByLanguagePlaylists();
  }

  private async createDecadeByLanguagePlaylists(): Promise<void> {
    const decadeCriteria = new Criteria();
    decadeCriteria.paging.distinct = true;
    decadeCriteria.searchCriteria.push(new CriteriaItem('releaseDecade', 0, CriteriaComparison.NotEquals));

    const languageCriteria = new Criteria();
    languageCriteria.paging.distinct = true;
    languageCriteria.addSorting('language');

    const options: IResultsIteratorOptions<SongExtendedViewEntity> = {
      entity: SongExtendedViewEntity,
      queries: [
        { criteria: decadeCriteria, columnExpression: { expression: 'releaseDecade' } },
        { criteria: languageCriteria, columnExpression: { expression: 'language' } }
      ],
      onResult: async (valuesObj: KeyValueGen<any>, items: SongExtendedViewEntity[]) => {
        console.log(valuesObj);
        if (items?.length) {
          // This config is only for passing the playlist name and the tracks
          const input: IExportConfig = {
            profileId: '',
            criteria: new Criteria(valuesObj['language'].toString()),
            songs: items,
            playlistConfig: this.config.playlistConfig
          };
          input.playlistConfig.playlistPrefix = valuesObj['releaseDecade'].toString() + '\'s';
          await this.playlistWriter.process(input);
        }
      }
    };
    await this.db.searchResultsIterator(options);
  }
}
