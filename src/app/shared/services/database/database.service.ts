import { Injectable } from '@angular/core';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AlbumEntity } from '../../models/album.entity';
import { ArtistEntity } from '../../models/artist.entity';
import { GenreEntity } from '../../models/genre.entity';
import { SongArtistEntity } from '../../models/song-artist.entity';
import { SongGenreEntity } from '../../models/song-genre.entity';
import { SongEntity } from '../../models/song.entity';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  public dataSource: DataSource;

  constructor() {
    const options: DataSourceOptions = {
      type: 'sqlite',
      database: 'solo-player.db',
      entities: [
        SongEntity,
        AlbumEntity,
        ArtistEntity,
        SongArtistEntity,
        GenreEntity,
        SongGenreEntity
      ],
      synchronize: true,
      logging: 'all'
    };
    this.dataSource = new DataSource(options);
  }

  public artistExists(id: string): Promise<boolean> {
    return ArtistEntity.findOneBy({ id }).then(artist => {
      return artist !== null;
    });
  }
}
