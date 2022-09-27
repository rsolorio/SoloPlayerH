import { Injectable } from '@angular/core';
import { DataSource, DataSourceOptions } from 'typeorm';
import { createHash } from 'crypto';
import { ArtistEntity, AlbumEntity, ClassificationEntity, SongEntity } from '../../entities';
import { IdEntity } from '../../entities/base.entity';

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
        ClassificationEntity
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
    // TODO: determine type from entity parameter
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

  public async getArtistsWithAlbums(): Promise<ArtistEntity[]> {
    return this.dataSource
      .getRepository(ArtistEntity)
      .createQueryBuilder('artist')
      .innerJoinAndSelect('artist.albums', 'album')
      .getMany();
  }

  public async getSongsWithClassification(classificationType: string, classificationName: string): Promise<SongEntity[]> {
    const classificationId = this.hash(`${classificationType}:${classificationName}`);
    return this.dataSource
      .getRepository(SongEntity)
      .createQueryBuilder('song')
      .innerJoinAndSelect('song.classifications', 'classification')
      .where('classification.id = :classificationId')
      .setParameter('classificationId', classificationId)
      .getMany();
  }

  public async getSongsWithGenre(genreName: string): Promise<SongEntity[]> {
    return this.getSongsWithClassification('Genre', genreName);
  }
}
