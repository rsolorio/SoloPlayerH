import { Injectable } from '@angular/core';
import { DataSource, DataSourceOptions } from 'typeorm';
import { createHash } from 'crypto';
import { AlbumEntity } from '../../models/album.entity';
import { ArtistEntity } from '../../models/artist.entity';
import { SongArtistEntity } from '../../models/song-artist.entity';
import { SongEntity } from '../../models/song.entity';
import { ClassificationEntity } from '../../models/classification.entity';
import { SongClassificationEntity } from '../../models/song-classification.entity';
import { IdEntity, IdNameEntity } from '../../models/base.entity';

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
        IdEntity,
        IdNameEntity,
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
    const x = this.dataSource.getRepository(SongEntity);
  }

  public hash(value: string): string {
    return createHash('sha1').update(value).digest('base64');
  }

  /**
   * Adds a new record to the database if the entity does not exist (based on its id).
   * @param entity The entity to be inserted in the database.
   * @returns The entity.
   */
  public async add<T extends IdEntity>(entity: T, entityType: typeof IdEntity): Promise<T> {
    const exists = await this.exists(entity.id, entityType);
    if (exists) {
      return entity;
    }
    return entity.save();
  }

  public exists(id: string, entityType: typeof IdEntity): Promise<boolean> {
    return entityType.findOneBy({ id }).then(entity => {
      return entity !== null;
    });
  }

  public exists2(id: string): Promise<boolean> {
    return IdEntity.findOneBy({ id }).then(entity => {
      return entity !== null;
    });
  }

  public async addSongArtist(songArtist: SongArtistEntity): Promise<SongArtistEntity> {
    const exists = await SongArtistEntity.findOneBy({
      songId: songArtist.songId, artistId: songArtist.artistId
    });
    if (exists) {
      return songArtist;
    }
    return songArtist.save();
  }

  public async AddSongClassification(songClassification: SongClassificationEntity): Promise<SongClassificationEntity> {
    const exists = await SongClassificationEntity.findOneBy({
      songId: songClassification.songId, classificationId: songClassification.classificationId
    });
    if (exists) {
      return songClassification;
    }
    return songClassification.save();
  }
}
