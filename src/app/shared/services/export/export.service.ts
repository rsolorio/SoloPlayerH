import { Injectable } from '@angular/core';
import { MetadataWriterService } from 'src/app/mapping/data-transform/metadata-writer.service';
import { IExportConfig } from './export.interface';
import { DatabaseEntitiesService } from '../database/database-entities.service';
import { DatabaseService } from '../database/database.service';
import { FilterEntity, SongTempEntity, SongViewEntity } from '../../entities';
import { ISongModel } from '../../models/song-model.interface';

/**
 * Service to copy audio and playlist files to other locations.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(
    private db: DatabaseService,
    private writer: MetadataWriterService,
    private entities: DatabaseEntitiesService) { }

  /**
   * Configurations:
   * 0. Empty folder, or real sync add/replace/remove (profile config)
   * 1. Audio directory: the destination path (profile property)
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
  public async copyAndTag(config: IExportConfig): Promise<void> {
    // In theory a writer should only have one data source
    await this.writer.init({ profileId: config.profileId });
    await this.prepareSongs(config);

    for (const song of config.songs) {
      // Writer needs to have the config to determine where the song will be saved, since the writer will save the file
      // writer.process (song) -- Change method to be generic or take an any; OR make the writer prepare the songs
      // -- getContext -> gets KeyValues using song and sources; mapping will determine how data from the song will be set into the KeyValues obj
      // -- copy file and save id3 directly from KeyValues
      // this doesn't really need the songTemp table, it only needs to process the songs in memory
    }

    // Another data source? We need a data source to get data from SongTemp/or regular views table for filters (and auto playlists) to export
    // This data source also needs the config object
    // This data source processes a playlist id or a filter id
    // Export also needs the config to determine where the playlists will be exported
  }

  /**
   * Sets up the songs in the config object based on the specified criteria and fills the SongTemp table if needed.
   */
  private async prepareSongs(config: IExportConfig): Promise<void> {
    if (!config.songs) {
      if (config.criteria) {
        config.songs = await this.db.getList(SongViewEntity, config.criteria);
      }
      else if (config.filterId) {
        const filter = await FilterEntity.findOneBy({ id: config.filterId });
        config.criteria = await this.entities.getCriteriaFromFilter(filter);
        config.songs = await this.db.getList(SongViewEntity, config.criteria);
      }
      else if (config.playlistId) {
        config.songs = await this.entities.getTracks(config.playlistId);
      }
    }

    if (config.songs) {
      await this.fillSongTemp(config.songs);
      config.songTempEnabled = true;
      // TODO: redirect song view, song artist view, song classification view to use the songTemp entity
      // Whenever getList is called we just need to use the SongTempEntity instead of the views
      return;
    }

    // Any songs before this point must be moved to a temporary table
    // so other criteria or filters can only apply to this subset
    // getList: song view -> song/album/artist, song artist view -> song/album/artist/partyRelation, song classification view -> song/album/artist/songClassification
    // getList: song view table

    // Send all songs
    config.songs = await SongViewEntity.find();
  }

  private async fillSongTemp(songs: ISongModel[]): Promise<void> {
    await SongTempEntity.clear();
    const songTempData: SongTempEntity[] = [];
    for (const song of songs) {
      const songTemp = this.db.mapEntities(song, SongTempEntity);
      songTempData.push(songTemp);
    }
    await this.db.bulkInsert(SongTempEntity, songTempData);
  }
}