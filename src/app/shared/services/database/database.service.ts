import { Injectable } from '@angular/core';
import { DataSource, DataSourceOptions } from 'typeorm';
import { createHash } from 'crypto';
import { ArtistEntity, AlbumEntity, ClassificationEntity, SongEntity } from '../../entities';
import { DbEntity } from '../../entities/base.entity';
import { IArtistModel } from '../../models/artist-model.interface';

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
      logging: ['query', 'error', 'warn']
    };
    this.dataSource = new DataSource(options);
    const x = this.dataSource.getRepository(SongEntity);
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

  public async getArtistsWithAlbums(): Promise<ArtistEntity[]> {
    return this.dataSource
      .getRepository(ArtistEntity)
      .createQueryBuilder('artist')
      .innerJoinAndSelect('artist.albums', 'album')
      .getMany();
  }

  public async getArtistSongCount(artistId: string): Promise<IArtistModel[]> {
    return this.dataSource
      .getRepository(ArtistEntity)
      .createQueryBuilder('artist')
      .innerJoin('artist.albums', 'album')
      .innerJoin('album.songs', 'song')
      .select('artist.name', 'name')
      .addSelect('COUNT(artist.name)', 'songCount')
      .groupBy('artist.name')
      .getRawMany();
  }

  public async getArtistsWithAlbumCount(): Promise<IArtistModel[]> {
    const query = `
      SELECT artist.id, artist.name, COUNT(album.id) AS albumCount, SUM(album.songCount) as songCount
      FROM artist INNER JOIN (
        SELECT album.id, album.primaryArtistId, album.name, album.releaseYear, COUNT(song.id) AS songCount
        FROM album INNER JOIN song ON album.id = song.primaryAlbumId
        GROUP BY album.id, album.primaryArtistId, album.name, album.releaseYear
      ) AS album ON artist.id = album.primaryArtistId
      GROUP BY artist.id, artist.name
    `;
    return this.dataSource.query(query);
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
}
