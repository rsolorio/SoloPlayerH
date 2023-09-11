import { Injectable } from '@angular/core';
import { IExportConfig } from './export.interface';
import { DatabaseEntitiesService } from '../database/database-entities.service';
import { DatabaseService } from '../database/database.service';
import { FilterEntity, SongExportEntity, ValueListEntryEntity } from '../../entities';
import { ISongModel } from '../../models/song-model.interface';
import { SyncProfileId } from '../database/database.seed';
import {
  SongExtendedByArtistViewEntity,
  SongExtendedByClassificationViewEntity,
  SongExtendedByPlaylistViewEntity,
  SongExtendedViewEntity
} from '../../entities/song-extended-view.entity';
import { Criteria, CriteriaItem } from '../criteria/criteria.class';
import { PartyRelationType } from '../../models/music.enum';
import { MetadataWriterService } from 'src/app/mapping/data-transform/metadata-writer.service';

/**
 * Service to copy audio and playlist files to other locations.
 * The export service will do one thing: export audio files and playlists based on configuration.
 * The configuration will be associated to a sync profile record.
 * The export service will have the responsibility of getting the list of song records to process based on config.
 * It will use a file writer to copy and tag the audio file; the writer will be initialized with the profile id,
 * and probably with some more info (like the destination directory); it will load all data sources associated, in this case, only one, the Song Row data source;
 * the export service will iterate each song row, pass it to the writer which will get the metadata (KeyValues), and use it to create the file with the proper tags in the proper location;
 * the mappings in the SongRow data source will determine how the KeyValues object is used to save the tags.
 * The export service now needs to determine three more actions: playlists, smartlists, autolists.
 * The export service will use the playlist writer; and pass location, playlist type, to initialize the writer.
 * The playlist writer will also use a SongRow data source but with less fields.
 * The export service will export playlists only if all songs were exported.
 * if so, it will iterate each playlist and use the playlist writer;
 * for each playlist, the writer will be loaded/initialized (which will create the playlist file in memory), then each song record passed to the writer will add
 * the track; once the playlist tracks are added, the playlist file should be created in the proper location. Call some kind of finalization process to actually save the file.
 * Do the same for filters, get the name, get the tracks (using the regular songview or the song temp), and use the writer.
 * Do the same for auto, get the name, get the tracks, use the writer.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(
    private db: DatabaseService,
    //private writer: MetadataNetWriterService,
    private writer: MetadataWriterService,
    private entities: DatabaseEntitiesService) { }

  /**
   * Configurations:
   * 0. Empty folder, or real sync add/replace/remove (profile config)
   * 2. Copy All? (data source config)
   * 3a. Copy all: yes
   * 3a1. Export playlists? If so, specify playlist directory, playlist format (profile config)
   * 3a2. Export smartlists as playlists (profile config)
   * 3b: Copy all: no
   * 3b1. Select data to export: playlist, filter? list of artists? current song list (criteria), Max songs. (data source config)
   * 3b2. Export smartlists as playlists
   * 3b3. Auto playlists (profile config)
   * 4. Flat file structure or follow existing structure?
   * 4. Select/update mappings? How to choose other mappings without changing existing ones.
   * 5. Save results in profile, Sync history?
   */
  public async copyAndTag(configOverride?: IExportConfig): Promise<void> {
    // In theory a writer should only have one data source
    const syncProfile = await this.entities.getSyncProfile(SyncProfileId.DefaultExport);
    let config = syncProfile.config as IExportConfig;
    if (configOverride) {
      syncProfile.directories = configOverride.directories;
      config = configOverride;
    }

    // Cache for getting classification data
    const nonPrimaryRelationsQuery = `
      SELECT partyRelation.artistId, partyRelation.songId, artist.name AS artistName
      FROM partyRelation
      INNER JOIN artist
      ON partyRelation.relatedId = artist.id
      WHERE relationTypeId = '${PartyRelationType.Featuring}'
      OR relationTypeId = '${PartyRelationType.Contributor}'
      OR relationTypeId = '${PartyRelationType.Singer}'
    `;
    // TODO: create interface or entity for this query
    syncProfile.nonPrimaryRelations = await this.db.run(nonPrimaryRelationsQuery);
    syncProfile.classifications = await ValueListEntryEntity.findBy({ isClassification: true });

    await this.writer.init(syncProfile);
    await this.prepareSongs(config);

    for (const song of config.songs) {
      await this.writer.process(song);
    }

    // Another data source? We need a data source to get data from SongTemp/or regular views table for filters (and auto playlists) to export
    // This data source also needs the config object
    // This data source processes a playlist id or a filter id
    // Export also needs the config to determine where the playlists will be exported
  }

  /**
   * Sets up the songs in the config object based on the specified criteria and fills the SongExport table if needed.
   */
  private async prepareSongs(config: IExportConfig): Promise<void> {
    if (!config.songs) {
      if (config.playlistId && !config.criteria) {
        config.criteria = new Criteria('Playlist Search');
        config.criteria.searchCriteria.push(new CriteriaItem('playlistId', config.playlistId));
      }
      if (config.filterId && !config.criteria) {
        const filter = await FilterEntity.findOneBy({ id: config.filterId });
        config.criteria = await this.entities.getCriteriaFromFilter(filter);
      }

      if (config.criteria) {
        if (config.criteria.hasComparison(false, 'playlistId')) {
          config.songs = await this.db.getList(SongExtendedByPlaylistViewEntity, config.criteria);
        }
        else if (config.criteria.hasComparison(false, 'classificationId')) {
          config.songs = await this.db.getList(SongExtendedByClassificationViewEntity, config.criteria);
        }
        else if (config.criteria.hasComparison(false, 'artistId')) {
          config.songs = await this.db.getList(SongExtendedByArtistViewEntity, config.criteria);
        }
        else {
          config.songs = await this.db.getList(SongExtendedViewEntity, config.criteria);
        }
      }
    }

    if (config.songs) {
      await this.fillSongExport(config.songs);
      config.songExportEnabled = true;
      // TODO: redirect song view, song artist view, song classification view to use the songTemp entity
      // Whenever getList is called we just need to use the SongTempEntity instead of the views
      return;
    }

    // Any songs before this point must be moved to a temporary table
    // so other criteria or filters can only apply to this subset
    // getList: song view -> song/album/artist, song artist view -> song/album/artist/partyRelation, song classification view -> song/album/artist/songClassification
    // getList: song view table

    // Send all songs
    config.songs = await SongExtendedViewEntity.find();
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
}
