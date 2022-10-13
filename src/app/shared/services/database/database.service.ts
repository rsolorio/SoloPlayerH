import { Injectable } from '@angular/core';
import { DataSource, DataSourceOptions } from 'typeorm';
import { createHash } from 'crypto';
import { ArtistEntity, AlbumEntity, ClassificationEntity, SongEntity } from '../../entities';
import { DbEntity } from '../../entities/base.entity';
import { AlbumArtistViewEntity } from '../../entities/album-artist-view.entity';
import { ArtistViewEntity } from '../../entities/artist-view.entity';
import { AlbumViewEntity } from '../../entities/album-view.entity';
import { IClassificationModel } from '../../models/classification-model.interface';
import { ClassificationViewEntity } from '../../entities/classification-view.entity';

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
        ClassificationEntity,
        ArtistViewEntity,
        AlbumArtistViewEntity,
        AlbumViewEntity,
        ClassificationViewEntity
      ],
      synchronize: true,
      logging: ['query', 'error', 'warn']
    };
    this.dataSource = new DataSource(options);
  }

  public hash(value: string): string {
    return createHash('sha1').update(value).digest('base64');
  }

  public hashArtist(artist: ArtistEntity): void {
    artist.id = this.hash(artist.name);
  }

  public hashAlbum(album: AlbumEntity): void {
    // Combine these fields to make album unique: ArtistName|AlbumName|ReleaseYear
    album.id = this.hash(`${album.primaryArtist.name}|${album.name}|${album.releaseYear}`);
  }

  public hashSong(song: SongEntity): void {
    song.id = this.hash(song.filePath);
  }

  public hashClassification(classification: ClassificationEntity): void {
    // Combine these fields to make album unique: ClassificationType:ClassificationName
    classification.id = this.hash(`${classification.classificationType}:${classification.name}`);
  }

  /**
   * Adds a new record to the database if the entity does not exist (based on its id).
   * @param entity The entity to be inserted in the database.
   * @returns The entity.
   */
  public async add<T extends DbEntity>(entity: T, entityType: typeof DbEntity): Promise<T> {
    // TODO: determine type from entity parameter
    const exists = await this.exists(entity.id, entityType);
    if (exists) {
      return entity;
    }
    return entity.save();
  }

  public exists(id: string, entityType: typeof DbEntity): Promise<boolean> {
    return entityType.findOneBy({ id }).then(entity => {
      return entity !== null;
    });
  }

  public exists2(id: string): Promise<boolean> {
    return DbEntity.findOneBy({ id }).then(entity => {
      return entity !== null;
    });
  }

  // public async getArtistsWithAlbums(): Promise<ArtistEntity[]> {
  //   return this.dataSource
  //     .getRepository(ArtistEntity)
  //     .createQueryBuilder('artist')
  //     .innerJoinAndSelect('artist.albums', 'album')
  //     .getMany();
  // }

  public async getAlbumArtistView(): Promise<AlbumArtistViewEntity[]> {
    return this.dataSource.manager.find(AlbumArtistViewEntity);
  }

  public async getArtistView(): Promise<ArtistViewEntity[]> {
    return this.dataSource.manager.find(ArtistViewEntity);
  }

  public async getAlbumView(): Promise<AlbumViewEntity[]> {
    return this.dataSource.manager.find(AlbumViewEntity);
  }

  public async getClassificationView(): Promise<ClassificationViewEntity[]> {
    return this.dataSource
      .getRepository(ClassificationViewEntity)
      .createQueryBuilder('classification')
      .where('classification.classificationType <> :classificationType')
      .setParameter('classificationType', 'Genre')
      .orderBy('classification.classificationType', 'ASC')
      .addOrderBy('classification.name', 'ASC')
      .getMany();
  }

  public async getGenreView(): Promise<ClassificationViewEntity[]> {
    return this.dataSource
      .getRepository(ClassificationViewEntity)
      .createQueryBuilder('classification')
      .where('classification.classificationType = :classificationType')
      .setParameter('classificationType', 'Genre')
      .orderBy('classification.name', 'ASC')
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

  public async getSongsFromArtist(artistId: string): Promise<SongEntity[]> {
    return this.dataSource
      .getRepository(SongEntity)
      .createQueryBuilder('song')
      .innerJoinAndSelect('song.artists', 'artist')
      .where('artist.id = :artistId')
      .setParameter('artistId', artistId)
      .getMany();
  }

  public async getSongsFromAlbumArtist(artistId: string): Promise<SongEntity[]> {
    return this.dataSource
      .getRepository(SongEntity)
      .createQueryBuilder('song')
      .innerJoinAndSelect('song.primaryAlbum', 'album')
      .innerJoinAndSelect('album.primaryArtist', 'artist')
      .where('artist.id = :artistId')
      .setParameter('artistId', artistId)
      .getMany();
  }

  public async getAllClassifications(): Promise<IClassificationModel[]> {
    return this.dataSource.getRepository(ClassificationEntity).find();
  }
}
