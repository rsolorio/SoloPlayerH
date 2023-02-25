import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { DataSource, DataSourceOptions } from 'typeorm';

import {
  ArtistEntity,
  AlbumEntity,
  ClassificationEntity,
  SongEntity,
  ArtistViewEntity,
  AlbumViewEntity,
  AlbumArtistViewEntity,
  SongViewEntity,
  ClassificationViewEntity,
  ArtistClassificationViewEntity,
  AlbumClassificationViewEntity,
  SongArtistViewEntity,
  PlaylistEntity,
  PlaylistSongEntity,
  PlaylistSongViewEntity,
  ModuleOptionEntity,
  SongArtistEntity,
  SongClassificationEntity,
  PlayHistoryEntity,
  SongClassificationViewEntity,
  PlaylistViewEntity
} from '../../shared/entities';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  public dataSource: DataSource;
  constructor(private events: EventsService, private log: LogService) { }

  /**
   * Initializes the application.
   * Contains init routines needed for the application to work properly.
   * It returns a promise that resolves when all the app init logic is done.
   */
  public async initialize(): Promise<void> {
    await this.initializeDatabase();
  }

  public async initializeDatabase(): Promise<DataSource> {
    this.log.info('Initializing database...');
    const options: DataSourceOptions = {
      type: 'sqlite',
      database: 'solo-player.db',
      entities: [
        SongEntity,
        AlbumEntity,
        ArtistEntity,
        ClassificationEntity,
        ArtistViewEntity,
        AlbumArtistViewEntity,
        AlbumViewEntity,
        ClassificationViewEntity,
        SongViewEntity,
        ArtistClassificationViewEntity,
        AlbumClassificationViewEntity,
        SongArtistViewEntity,
        SongClassificationViewEntity,
        PlaylistEntity,
        PlaylistSongEntity,
        PlaylistViewEntity,
        PlaylistSongViewEntity,
        ModuleOptionEntity,
        SongArtistEntity,
        SongClassificationEntity,
        PlayHistoryEntity
      ],
      synchronize: true,
      logging: ['query', 'error', 'warn']
    };
    this.dataSource = new DataSource(options);
    await this.dataSource.initialize();
    this.log.info('Database initialized!');
    this.events.broadcast(AppEvent.DbInitialized);
    return this.dataSource;
  }
}
