import { Injectable } from '@angular/core';
import { Brackets, DataSource, DataSourceOptions, EntityTarget, InsertResult, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import * as objectHash from 'object-hash'
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
  PlaylistSongViewEntity,
  ModuleOptionEntity,
  SongArtistEntity,
  SongClassificationEntity
} from '../../entities';
import { SongClassificationViewEntity } from '../../entities/song-classification-view.entity';
import { PlaylistViewEntity } from '../../entities/playlist-view.entity';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { ModuleOptionEditor, ModuleOptionName } from '../../models/module-option.enum';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from '../../models/events.enum';
import { LogService } from 'src/app/core/services/log/log.service';
import { IQueryModel } from '../../models/pagination-model.interface';

/**
 * Wrapper for the typeorm library that connects to the Sqlite database.
 * Typeorm uses https://www.npmjs.com/package/reflect-metadata to get metadata from its entities.
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private columnDisplayNames: { [columnName: string]: string } = {
    'artistId': 'Artist',
    'primaryArtistId': 'Album Artist',
    'primaryAlbumId': 'Album',
    'classificationId': 'Classification'
  };
  private dataSource: DataSource;
  /**
   * Maximum number of parameters in a single statement.
   * Just an internal constant to do the limit calculations
   */
  private SQLITE_MAX_VARIABLE_NUMBER = 32766;

  constructor(
    private utilities: UtilityService,
    private events: EventsService,
    private log: LogService) {
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
        SongClassificationEntity
      ],
      synchronize: true,
      logging: ['query', 'error', 'warn']
    };
    this.dataSource = new DataSource(options);
  }

  public initialize(): Promise<DataSource> {
    this.log.info('Initializing database...');
    return this.dataSource.initialize().then(ds => {
      this.events.broadcast(AppEvent.DbInitialized);
      this.log.info('Database initialized!');
      return ds;
    });
  }

  /**
   * Deletes the data, drops the db objects and recreates the database.
   */
  public async purge(): Promise<DataSource> {
    // Delete data and drop db objects
    await this.dataSource.dropDatabase();
    // Close any remaining connections since the init process reconnects
    await this.dataSource.destroy();
    // Re init
    return this.initialize();
  }

  public displayName(columnName: string): string {
    return this.columnDisplayNames[columnName];
  }

  public hash(value: string): string {
    // Defaults to sha1 with hex encoding
    return objectHash(value);
  }

  public hashDbEntity(entity: DbEntity): void {
    entity.id = this.hash(entity.name.toLowerCase());
  }

  public hashArtist(artist: ArtistEntity): void {
    this.hashDbEntity(artist);
  }

  public hashAlbum(album: AlbumEntity): void {
    // Combine these fields to make album unique: ArtistName|AlbumName|ReleaseYear
    album.id = this.hash(`${album.primaryArtist.name.toLowerCase()}|${album.name.toLowerCase()}|${album.releaseYear}`);
  }

  public hashSong(song: SongEntity): void {
    song.id = this.hash(song.filePath.toLowerCase());
  }

  public hashClassification(classification: ClassificationEntity): void {
    // Combine these fields to make classification unique: ClassificationType|ClassificationName
    classification.id = this.hash(`${classification.classificationType.toLowerCase()}|${classification.name.toLowerCase()}`);
  }

  public hashPlaylist(playlist: PlaylistEntity): void {
    this.hashDbEntity(playlist);
  }

  public hashModuleOption(moduleOption: ModuleOptionEntity): void {
    this.hashDbEntity(moduleOption);
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

  // SQLite Bulk Actions - BEGIN
  /*
    You should take in consideration the SQLite limits mentioned here:
    https://www.sqlite.org/limits.html
    and here: https://www.sqlite.org/c3ref/c_limit_attached.html
    The most important one for this app is:
    Maximum Number Of Host Parameters In A Single SQL Statement (SQLITE_MAX_VARIABLE_NUMBER)
    The default value for the variable is: 32766 for SQLite versions after 3.32.0
    If you reach the limit you will get this error: "too many SQL variables".
    You can do the math by getting the number of columns in a certain entity and the number of records to be inserted/updated.
  */

  /**
   * Performs multiple insert actions in a single transaction.
   * The values parameter gets affected by this method since a splice is performed to do this in smaller chunks if needed.
   */
  public async bulkInsert<T extends ObjectLiteral>(entity: EntityTarget<T>, values: T[]): Promise<InsertResult[]> {
    const response: InsertResult[] = [];
    const bulkSize = this.getBulkSize(entity, values);
    let bulkIndex = 0;
    while (values.length) {
      bulkIndex++;
      const items = values.splice(0, bulkSize);
      this.log.info(`Bulk insert ${bulkIndex} with ${items.length} items.`);
      const result = await this.dataSource.createQueryBuilder().insert().into(entity).values(items).execute();
      response.push(result);
    }
    return response;
  }

  /**
   * Performs multiple update actions in a single transaction. The way it works is through an "upsert" mechanism;
   * it tries to insert the data and it fails it will try to update. For this to work you have to specify the columns
   * that will be updated if the insert fails.
   */
  public async bulkUpdate<T extends ObjectLiteral>(entity: EntityTarget<T>, values: T[], updateColumns: string[]): Promise<InsertResult[]> {
    const response: InsertResult[] = [];
    // Even though we are using just a few columns to do the update, in reality we are first performing an insert so we need to take in consideration
    // all columns in the entity to determine the bulk size.
    const bulkSize = this.getBulkSize(entity, values);
    let bulkIndex = 0;
    while (values.length) {
      bulkIndex++;
      const items = values.splice(0, bulkSize);
      this.log.info(`Bulk update ${bulkIndex} with ${items.length} items.`);
      const result = await this.dataSource.createQueryBuilder().insert().into(entity).values(values).orUpdate(updateColumns).execute();
      response.push(result);
    }

    return response;
  }

  private getBulkSize<T extends ObjectLiteral>(entity: EntityTarget<T>, values: T[]): number {
    const repo = this.dataSource.getRepository(entity);
    const totalParameters = values.length * repo.metadata.columns.length;
    const totalBulks = Math.ceil(totalParameters / this.SQLITE_MAX_VARIABLE_NUMBER);
    const bulkSize = Math.ceil(values.length / totalBulks);
    this.log.info(`Total items: ${values.length}. Total columns: ${repo.metadata.columns.length}. Total parameters: ${totalParameters}. Total bulks: ${totalBulks}. Bulk size: ${bulkSize}.`);
    return bulkSize;
  }

  // SQLite Bulk Actions - END

  public getList<T extends ObjectLiteral>(entity: EntityTarget<T>, queryModel: IQueryModel<T>): Promise<T[]> {
    const entityTempName = 'getListEntity';
    const repo = this.dataSource.getRepository(entity);
    return this.createQueryBuilder(repo, entityTempName, queryModel).getMany();
  }

  private createQueryBuilder<T>(
    repo: Repository<T>, entityName: string, queryModel: IQueryModel<T>
  ): SelectQueryBuilder<T> {
    let queryBuilder = repo.createQueryBuilder(entityName);

    let allCriteria: ICriteriaValueBaseModel[] = [];
    if (queryModel.systemCriteria) {
      allCriteria = allCriteria.concat(queryModel.systemCriteria);
    }
    if (queryModel.breadcrumbCriteria) {
      allCriteria = allCriteria.concat(queryModel.breadcrumbCriteria);
    }
    if (queryModel.filterCriteria) {
      allCriteria = allCriteria.concat(queryModel.filterCriteria);
    }

    if (!allCriteria.length) {
      return queryBuilder;
    }

    this.buildSelect(queryBuilder, entityName, allCriteria, repo.metadata.columns);
    queryBuilder = this.buildWhere(queryBuilder, entityName, allCriteria);
    queryBuilder = this.buildOrderBy(queryBuilder, entityName, allCriteria);
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

  public async initializeModuleOptions(): Promise<void> {
    await this.initArtistSplitChars();
    await this.initGenreSplitChars();
  }

  public getModuleOptions(names?: string[]): Promise<ModuleOptionEntity[]> {
    if (!names || !names.length) {
      return ModuleOptionEntity.find();
    }

    let queryBuilder = this.dataSource
      .getRepository(ModuleOptionEntity)
      .createQueryBuilder('moduleOption');

    let hasWhere = false;
    let parameterIndex = 0;
    for (const optionName of names) {
      parameterIndex++;
      const parameterName = 'name' + parameterIndex.toString();
      const where = `moduleOption.name = ${parameterName}`;
      const parameter = {};
      parameter[parameterName] = optionName;
      if (hasWhere) {
        queryBuilder = queryBuilder.orWhere(where, parameter);
      }
      else {
        queryBuilder = queryBuilder.where(where, parameter);
        hasWhere = true;
      }
    }

    return queryBuilder.getMany();
  }

  public getOptionTextValues(moduleOption: ModuleOptionEntity): string[] {
    if (moduleOption.valueEditorType !== ModuleOptionEditor.Text) {
      // TODO:
    }
    return JSON.parse(moduleOption.values) as string[];
  }

  private async initArtistSplitChars(): Promise<void> {
    const option = new ModuleOptionEntity();
    option.name = ModuleOptionName.ArtistSplitCharacters;
    this.hashDbEntity(option);

    const existingOption = await ModuleOptionEntity.findOneBy({ id: option.id });
    if (existingOption) {
      return;
    }

    option.moduleName = 'Music';
    option.title = 'Artist Split Characters';
    option.description = 'Symbols to be used to split the Artist tag into multiple artists.';
    option.valueEditorType = ModuleOptionEditor.Text;
    option.multipleValues = true;
    option.system = false;
    option.values = JSON.stringify(['\\']);

    await option.save();
  }

  private async initGenreSplitChars(): Promise<void> {
    const option = new ModuleOptionEntity();
    option.name = ModuleOptionName.GenreSplitCharacters;
    this.hashDbEntity(option);

    const existingOption = await ModuleOptionEntity.findOneBy({ id: option.id });
    if (existingOption) {
      return;
    }

    option.moduleName = 'Music';
    option.title = 'Genre Split Characters';
    option.description = 'Symbols to be used to split the Genre tag into multiple genres.';
    option.valueEditorType = ModuleOptionEditor.Text;
    option.multipleValues = true;
    option.system = false;
    option.values = JSON.stringify(['\\']);

    await option.save();
  }
}
