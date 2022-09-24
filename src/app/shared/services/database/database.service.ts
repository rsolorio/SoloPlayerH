import { Injectable } from '@angular/core';
import { DataSource, DataSourceOptions } from 'typeorm';
import { createHash } from 'crypto';
import { AlbumEntity } from '../../models/album.entity';
import { ArtistEntity } from '../../models/artist.entity';
import { SongArtistEntity } from '../../models/song-artist.entity';
import { SongEntity } from '../../models/song.entity';
import { ClassificationEntity } from '../../models/classification.entity';
import { SongClassificationEntity } from '../../models/song-classification.entity';

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
        ClassificationEntity,
        SongClassificationEntity
      ],
      synchronize: true,
      logging: 'all'
    };
    this.dataSource = new DataSource(options);
  }

  public hash(value: string): string {
    return createHash('sha1').update(value).digest('base64');
  }

  public artistExists(id: string): Promise<boolean> {
    return ArtistEntity.findOneBy({ id }).then(artist => {
      return artist !== null;
    });
  }
}
