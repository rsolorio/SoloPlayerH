import { Injectable } from '@angular/core';
import { Brackets, DataSource, DataSourceOptions, EntityTarget, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { createHash } from 'crypto';
import { groupBy } from 'lodash';
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
  DbEntity,
  ArtistClassificationViewEntity,
  AlbumClassificationViewEntity,
  SongArtistViewEntity,
  PlaylistEntity,
  PlaylistSongEntity,
  PlaylistSongViewEntity
} from '../../entities';
import { SongClassificationViewEntity } from '../../entities/song-classification-view.entity';
import { PlaylistViewEntity } from '../../entities/playlist-view.entity';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';

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
        SongViewEntity,
        ArtistClassificationViewEntity,
        AlbumClassificationViewEntity,
        SongArtistViewEntity,
        SongClassificationViewEntity,
        PlaylistEntity,
        PlaylistSongEntity,
        PlaylistViewEntity,
        PlaylistSongViewEntity
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
    // Combine these fields to make classification unique: ClassificationType:ClassificationName
    classification.id = this.hash(`${classification.classificationType}:${classification.name}`);
  }

  public hashPlaylist(playlist: PlaylistEntity): void {
    playlist.id = this.hash(playlist.name);
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

  public getList<T extends ObjectLiteral>(entity: EntityTarget<T>, criteria: ICriteriaValueBaseModel[]): Promise<T[]> {
    const entityTempName = 'getListEntity';
    const repo = this.dataSource.getRepository(entity);
    return this.createQueryBuilder(repo, entityTempName, criteria).getMany();
  }

  private createQueryBuilder<T>(
    repo: Repository<T>, entityName: string, criteria: ICriteriaValueBaseModel[]
  ): SelectQueryBuilder<T> {
    let queryBuilder = repo.createQueryBuilder(entityName);

    if (!criteria || !criteria.length) {
      return queryBuilder;
    }

    this.buildSelect(queryBuilder, entityName, criteria, repo.metadata.columns);
    queryBuilder = this.buildWhere(queryBuilder, entityName, criteria);
    queryBuilder = this.buildOrderBy(queryBuilder, entityName, criteria);
    return queryBuilder;
  }

  private buildSelect<T>(
    queryBuilder: SelectQueryBuilder<T>, entityName: string, criteria: ICriteriaValueBaseModel[], columns: ColumnMetadata[]
  ) {
    let hasColumns = false;
    for (const column of columns) {
      const criteriaValue = criteria.find(item => item.ColumnName === column.databaseName);
      if (!criteriaValue || !criteriaValue.IgnoreInSelect) {
        const columnName = `${entityName}.${column.databaseName}`;
        if (hasColumns) {
          queryBuilder.addSelect(columnName);
        }
        else {
          queryBuilder.select(columnName);
          hasColumns = true;
        }
      }
    }
  }

  private buildWhere<T>(
    queryBuilder: SelectQueryBuilder<T>, entityName: string, criteria: ICriteriaValueBaseModel[]
  ): SelectQueryBuilder<T> {
    let hasFirstLevelWhere = false;
    const whereCriteria = criteria.filter(criteriaItem => criteriaItem.Operator !== CriteriaOperator.None);
    const groupedCriteria = groupBy(whereCriteria, 'ColumnName');
    for (const columnName of Object.keys(groupedCriteria)) {
      const columnCriteria = groupedCriteria[columnName];
      let hasSecondLevelWhere = false;
      const brackets = new Brackets(qb => {
        // Make sure we have unique parameters even if the column is the same
        let parameterIndex = 0;
        for (const criteriaItem of columnCriteria) {
          parameterIndex++;
          const parameterName = criteriaItem.ColumnName + parameterIndex.toString();
          const where = `${entityName}.${criteriaItem.ColumnName} ${this.getOperatorText(criteriaItem.Operator)} :${parameterName}`;
          const parameter = {};
          parameter[parameterName] = criteriaItem.ColumnValue;
          if (hasSecondLevelWhere) {
            qb = qb.orWhere(where, parameter);
          }
          else {
            qb = qb.where(where, parameter);
            hasSecondLevelWhere = true;
          }
        }
      });
      if (hasFirstLevelWhere) {
        queryBuilder = queryBuilder.andWhere(brackets);
      }
      else {
        queryBuilder = queryBuilder.where(brackets);
        hasFirstLevelWhere = true;
      }
    }
    return queryBuilder;
  }

  private buildOrderBy<T>(
    queryBuilder: SelectQueryBuilder<T>, entityName: string, criteria: ICriteriaValueBaseModel[]
  ): SelectQueryBuilder<T> {
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

  /**
   * OBSOLETE: Use SongViewEntity instead.
   * @param artistId 
   * @returns 
   */
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

  public async getPlaylistWithSongs(playlistId: string): Promise<PlaylistEntity> {
    return this.dataSource
      .getRepository(PlaylistEntity)
      .createQueryBuilder('playlist')
      .innerJoinAndSelect('playlist.playlistSongs', 'playlistSong')
      .innerJoinAndSelect('playlistSong.song', 'song')
      .where('playlist.id = :playlistId')
      .setParameter('playlistId', playlistId)
      .getOne();
  }
}
