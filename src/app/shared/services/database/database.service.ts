import { Injectable } from '@angular/core';
import { DataSource, DataSourceOptions, EntityTarget, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { createHash } from 'crypto';
import { IClassificationModel } from '../../models/classification-model.interface';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from '../../models/criteria-base-model.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
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
  DbEntity
} from '../../entities';

/**
 * Wrapper for the typeorm library that connects to the Sqlite database.
 * Typeorm uses https://www.npmjs.com/package/reflect-metadata to get metadata from its entities.
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  public dataSource: DataSource;

  constructor(private utilities: UtilityService) {
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
        SongViewEntity
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

  // public async getArtistView(): Promise<ArtistViewEntity[]> {
  //   return this.dataSource.manager.find(ArtistViewEntity);
  // }

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

  public async getList<T extends ObjectLiteral>(entity: EntityTarget<T>, criteria: ICriteriaValueBaseModel[]): Promise<T[]> {
    const entityTempName = 'getListEntity';
    const queryBuilder = this.dataSource.getRepository(entity).createQueryBuilder(entityTempName);
    return this.applyCriteria(queryBuilder, entityTempName, criteria).getMany();
  }

  private applyCriteria<T>(
    queryBuilder: SelectQueryBuilder<T>, entityName: string, criteria: ICriteriaValueBaseModel[]
  ): SelectQueryBuilder<T> {
    if (!criteria || !criteria.length) {
      return queryBuilder;
    }

    // Build where clause
    let hasWhere = false;
    const whereCriteria = criteria.filter(criteriaItem => criteriaItem.Operator !== CriteriaOperator.None);
    whereCriteria.forEach(criteriaItem => {
      const where = `${entityName}.${criteriaItem.ColumnName} ${this.getOperatorText(criteriaItem.Operator)} :${criteriaItem.ColumnName}`;
      const parameter = {};
      parameter[criteriaItem.ColumnName] = criteriaItem.ColumnValue;
      if (hasWhere) {
        queryBuilder = queryBuilder.andWhere(where, parameter);
      }
      else {
        queryBuilder = queryBuilder.where(where, parameter);
        hasWhere = true;
      }
    });

    // Order by
    let hasOrderBy = false;
    const orderByCriteria = criteria.filter(criteriaItem => criteriaItem.SortSequence > 0);
    this.utilities.sort(orderByCriteria, 'SortSequence').forEach(orderByItem => {
      const column = `${entityName}.${orderByItem.ColumnName}`;
      const order = orderByItem.SortDirection === CriteriaSortDirection.Ascending ? 'ASC' : 'DESC';
      if (hasOrderBy) {
        queryBuilder = queryBuilder.addOrderBy(column, order);
      }
      else {
        queryBuilder = queryBuilder.orderBy(column, order);
        hasOrderBy = true;
      }
    });
    return queryBuilder;
  }

  private getOperatorText(operator: CriteriaOperator): string {
    switch (operator) {
      case CriteriaOperator.None:
        return null;
      case CriteriaOperator.Equals:
        return '=';
      case CriteriaOperator.NotEquals:
        return '<>';
      case CriteriaOperator.GreaterThan:
        return '>';
      case CriteriaOperator.GreaterThanOrEqualTo:
        return '>=';
      case CriteriaOperator.LessThan:
        return '<';
      case CriteriaOperator.LessThanOrEqualTo:
        return '<=';
      case CriteriaOperator.Like:
        return 'LIKE';
      case CriteriaOperator.IsNull:
        return 'IS NULL';
      case CriteriaOperator.IsNotNull:
        return 'IS NOT NULL';
    }
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

  public async getSongView(): Promise<SongViewEntity[]> {
    return this.dataSource.manager.find(SongViewEntity);
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
