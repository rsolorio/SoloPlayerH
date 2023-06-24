import { Injectable } from '@angular/core';
import { Brackets, DataSource, EntityTarget, InsertResult, ObjectLiteral, Repository, SelectQueryBuilder, DataSourceOptions, EntityMetadata } from 'typeorm';
import * as objectHash from 'object-hash'
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import {
  ArtistEntity,
  AlbumEntity,
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
  SongClassificationEntity,
  PlayHistoryEntity,
  SongClassificationViewEntity,
  PlaylistViewEntity,
  ValueListTypeEntity,
  ValueListEntryEntity,
  DataSourceEntity,
  DataMappingEntity
} from '../../entities';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { ModuleOptionEditor, ModuleOptionName } from '../../models/module-option.enum';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { databaseColumns, DbColumn } from './database.columns';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { Criteria, CriteriaItem, CriteriaItems } from '../criteria/criteria.class';
import { CriteriaComparison, CriteriaJoinOperator, CriteriaSortDirection, CriteriaTransformAlgorithm, CriteriaValueEditor } from '../criteria/criteria.enum';
import { IComparison, ICriteriaValueSelector } from '../criteria/criteria.interface';
import { ListTransformService } from '../list-transform/list-transform.service';
import { AppEvent } from '../../models/events.enum';
import { RelatedImageEntity } from '../../entities/related-image.entity';
import { ISongModel } from '../../models/song-model.interface';
import { HttpClient } from '@angular/common/http';

interface IBulkInfo {
  /** Maximum number of parameters allowed on each bulk. */
  parameterMax: number;
  /** Number of rows. */
  itemCount: number;
  /** Number of columns on each row. */
  columnCount: number;
  /** Total number of parameters to be used for all columns in all rows. */
  parameterCount: number;
  /** Number of bulks needed to process all items. */
  bulkCount: number;
  /** Number of rows on each bulk. */
  bulkSize: number;
}

/**
 * Wrapper for the typeorm library that connects to the Sqlite database.
 * Typeorm uses https://www.npmjs.com/package/reflect-metadata to get metadata from its entities.
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private dataSource: DataSource;
  private valueSelectors: { [columnName: string]: ICriteriaValueSelector } = { };
  private comparisons: { [id: number]: IComparison} = { };
  /**
   * Maximum number of parameters in a single statement for SqlLite.
   * Just an internal constant to do the limit calculations
   */
  private SQLITE_MAX_VARIABLE_NUMBER = 32766;

  constructor(
    private utilities: UtilityService,
    private events: EventsService,
    private log: LogService,
    private transformService: ListTransformService,
    private http: HttpClient)
  {
    this.setValueSelectors();
    this.setComparisons();
  }

  // START - DB INIT //////////////////////////////////////////////////////////////////////////////
  public async initializeDatabase(): Promise<DataSource> {
    this.log.info('Initializing database...');
    const options: DataSourceOptions = {
      type: 'sqlite',
      database: 'solo-player.db',
      entities: [
        SongEntity,
        AlbumEntity,
        ArtistEntity,
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
        PlayHistoryEntity,
        ValueListTypeEntity,
        ValueListEntryEntity,
        RelatedImageEntity,
        DataSourceEntity,
        DataMappingEntity
      ],
      synchronize: true,
      logging: ['error'],
      //logging: ['query', 'error', 'warn']
    };
    this.dataSource = new DataSource(options);
    await this.dataSource.initialize();
    this.log.info('Data source initialized.');
    await this.initializeData();
    this.log.info('Database ready.');
    this.events.broadcast(AppEvent.DbInitialized);
    return this.dataSource;
  }

  private async initializeData(): Promise<void> {
    // HACK: determine if the default data is already inserted
    // by getting the number of records in the value list type table
    // TODO: make this validation using a system flag or make every table in the
    // default data validate the records, or validate record by record
    const typeCount = await ValueListTypeEntity.count();
    if (typeCount > 0) {
      this.log.info('Default data already exists.');
      return;
    }
    const data = await this.getDefaultData();
    await this.insertDefaultData(data);
    this.log.info('Default data initialized.');
  }

  private findEntityMetadata(name: string): EntityMetadata {
    return this.dataSource.entityMetadatas.find(m => m.givenTableName === name);
  }

  private async insertDefaultData(defaultDataObj: object): Promise<void> {
    const tables = defaultDataObj['tables'];
    if (!tables) {
      return;
    }
    
    for (const tableName of Object.keys(tables)) {
      const entities: any[] = [];
      const rows = tables[tableName];
      for (const row of rows) {
        const entity = this.getEntityFromTable(tableName);
        for (const columnName of Object.keys(row)) {
          if (columnName === '//') {
            continue;
          }
          entity[columnName] = row[columnName];
        }
        if (!entity['id']) {
          entity['id'] = this.utilities.newGuid();
        }
        entities.push(entity);
      }
      await this.bulkInsertFromTable(tableName, entities);
    }
  }

  private getEntityFromTable(tableName: string): any {
    const m = this.findEntityMetadata(tableName);
    return m.create();
  }

  private async bulkInsertFromTable(tableName: string, entities: any[]): Promise<void> {
    const m = this.findEntityMetadata(tableName);
    await this.bulkInsert(m.target, entities);
  }

  // END - DB INIT ////////////////////////////////////////////////////////////////////////////////

  /**
   * Deletes the data, drops the db objects and recreates the database.
   */
  public async purge(): Promise<DataSource> {
    // Delete data and drop db objects
    await this.dataSource.dropDatabase();
    // Close any remaining connections since the init process reconnects
    await this.dataSource.destroy();
    // Re init
    return await this.initializeDatabase();
  }

  public displayName(columnName: string): string {
    return databaseColumns[columnName].caption;
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
    const bulkInfo = this.getBulkSize(entity, values);
    if (!bulkInfo || !bulkInfo.bulkSize) {
      this.log.warn('Empty bulk, aborting bulk insert.');
      return [];
    }
    let bulkIndex = 0;
    while (values.length) {
      bulkIndex++;
      const items = values.splice(0, bulkInfo.bulkSize);
      this.log.info(`Bulk insert ${bulkIndex} (of ${bulkInfo.bulkCount}) with ${items.length} items.`);
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
    const bulkInfo = this.getBulkSize(entity, values);
    if (!bulkInfo || !bulkInfo.bulkSize) {
      this.log.warn('Empty bulk, aborting bulk update.');
      return [];
    }
    let bulkIndex = 0;
    while (values.length) {
      bulkIndex++;
      const items = values.splice(0, bulkInfo.bulkSize);
      this.log.info(`Bulk update ${bulkIndex} (of ${bulkInfo.bulkCount}) with ${items.length} items.`);
      const result = await this.dataSource.createQueryBuilder().insert().into(entity).values(items).orUpdate(updateColumns).execute();
      response.push(result);
    }

    return response;
  }

  private getBulkSize<T extends ObjectLiteral>(entity: EntityTarget<T>, values: T[]): IBulkInfo {
    const repo = this.dataSource.getRepository(entity);
    const bulkInfo: IBulkInfo = {
      parameterMax: this.SQLITE_MAX_VARIABLE_NUMBER,
      itemCount: values.length,
      columnCount: repo.metadata.columns.length,
      parameterCount: values.length * repo.metadata.columns.length,
      bulkCount: 0,
      bulkSize: 0
    };
    bulkInfo.bulkCount = Math.ceil(bulkInfo.parameterCount / bulkInfo.parameterMax);
    bulkInfo.bulkSize = bulkInfo.bulkCount > 0 ? Math.ceil(bulkInfo.itemCount / bulkInfo.bulkCount) : 0;
    this.log.info('Bulk info:', bulkInfo);
    return bulkInfo;
  }

  // SQLite Bulk Actions - END

  public async getList<T extends ObjectLiteral>(entity: EntityTarget<T>, criteria: Criteria): Promise<T[]> {
    const entityTempName = 'getListEntity';
    const repo = this.dataSource.getRepository(entity);
    this.log.debug('getList criteria', criteria);
    const result = await this.createQueryBuilder(repo, entityTempName, criteria).getMany();
    const transformedResult = this.transformService.transform(result, criteria.transformAlgorithm);
    return transformedResult;
  }

  public getRepo<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return this.dataSource.getRepository(entity);
  }

  private createQueryBuilder<T>(
    repo: Repository<T>, entityName: string, criteria: Criteria
  ): SelectQueryBuilder<T> {
    let queryBuilder = repo.createQueryBuilder(entityName);

    if (!criteria.hasItems()) {
      return queryBuilder;
    }

    this.buildSelect(queryBuilder, entityName, criteria, repo.metadata.columns);
    queryBuilder = this.buildWhere(queryBuilder, entityName, criteria);
    if (criteria.random) {
      queryBuilder = this.buildOrderByRandom(queryBuilder, criteria.paging.pageSize);
    }
    else {
      // Here we only send the sorting criteria, this is how we support this
      queryBuilder = this.buildOrderBy(queryBuilder, entityName, criteria.sortingCriteria);
    }
    return queryBuilder;
  }

  private buildSelect<T>(
    queryBuilder: SelectQueryBuilder<T>, entityName: string, criteria: Criteria, columns: ColumnMetadata[]
  ) {
    let hasColumns = false;
    for (const column of columns) {
      if (!criteria.ignoredInSelect(column.databaseName)) {
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
    if (criteria.paging.pageSize) {
      queryBuilder.take(criteria.paging.pageSize);
    }
  }

  private buildWhere<T>(
    queryBuilder: SelectQueryBuilder<T>, entityName: string, criteria: Criteria
  ): SelectQueryBuilder<T> {
    const allCriteria = [criteria.systemCriteria, criteria.breadcrumbCriteria, criteria.userCriteria, criteria.searchCriteria];
    let hasWhere = false;
    for (const criteria of allCriteria) {
      // This is safe guard since criteria should not have none comparisons
      const whereCriteria = criteria.getComparisons();
      if (whereCriteria.length) {
        if (hasWhere) {
          // All criteria will be joined with the AND operator since all criteria must be used to get the results
          queryBuilder = queryBuilder.andWhere(this.createFirstLevelBrackets(entityName, whereCriteria));
        }
        else {
          queryBuilder = queryBuilder.where(this.createFirstLevelBrackets(entityName, whereCriteria));
          hasWhere = true;
        }
      }
    }
    return queryBuilder;
  }

  /**
   * Creates the first level where expression that consists of different criteria columns joined together.
   */
  private createFirstLevelBrackets(entityName: string, whereCriteria: CriteriaItem[]): Brackets  {
    const result = new Brackets(qb1 => {
      let hasWhere = false;
      for (const criteriaItem of whereCriteria) {
        let whereBrackets: Brackets;
        if (criteriaItem.comparison === CriteriaComparison.IsNull || criteriaItem.comparison === CriteriaComparison.IsNotNull) {
          // Ignore column values for these operators
          whereBrackets = new Brackets(qb => {
            qb.where(`${entityName}.${criteriaItem.columnName} ${this.comparison(criteriaItem.comparison).text}`);
          });
        }
        else {
          whereBrackets = this.createSecondLevelBrackets(entityName, criteriaItem);
        }
        if (hasWhere) {
          // This operator will be determined by criteria item
          // The auto setting should be AND since most of the times you will need to join expressions with that operator
          if (criteriaItem.expressionOperator === CriteriaJoinOperator.Auto || criteriaItem.expressionOperator === CriteriaJoinOperator.And) {
            qb1 = qb1.andWhere(whereBrackets);
          }
          else {
            qb1 = qb1.orWhere(whereBrackets);
          }
        }
        else {
          qb1 = qb1.where(whereBrackets);
          hasWhere = true;
        }
      }
    });
    return result;
  }

  /**
   * Creates the second level where expression that consists of multiple values from one column joined together.
   */
  private createSecondLevelBrackets(entityName: string, criteriaItem: CriteriaItem): Brackets {
    let hasWhere = false;
    const brackets = new Brackets(qb2 => {
      // Typeorm requires unique parameters even if the column is the same
      let parameterIndex = 0;
      for (const valuePair of criteriaItem.columnValues) {
        parameterIndex++;
        const parameterName = criteriaItem.columnName + parameterIndex.toString();
        const where = `${entityName}.${criteriaItem.columnName} ${this.comparison(criteriaItem.comparison).text} :${parameterName}`;
        const parameter = {};
        parameter[parameterName] = valuePair.value;
        if (hasWhere) {
          // The OR operator is for conditions using the same column
          // TODO: when all values are using "NOT EQUALS" the operator should be AND; maybe a valuesOperator property?
          qb2 = qb2.orWhere(where, parameter);
        }
        else {
          qb2 = qb2.where(where, parameter);
          hasWhere = true;
        }
      }
    });
    return brackets;
  }

  private buildOrderBy<T>(
    queryBuilder: SelectQueryBuilder<T>, entityName: string, criteriaItems: CriteriaItems
  ): SelectQueryBuilder<T> {
    let hasOrderBy = false;
    // This is a safe guard since this should only receive sorting items
    const orderByCriteria = criteriaItems.filter(criteriaItem => criteriaItem.sortSequence > 0);
    this.utilities.sort(orderByCriteria, 'sortSequence').forEach(orderByItem => {
      const column = `${entityName}.${orderByItem.columnName}`;
      const order = orderByItem.sortDirection === CriteriaSortDirection.Ascending ? 'ASC' : 'DESC';
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

  private buildOrderByRandom<T>(queryBuilder: SelectQueryBuilder<T>, limit: number): SelectQueryBuilder<T> {
    queryBuilder.orderBy('RANDOM()');
    if (limit > 0) {
      queryBuilder.take(limit);
    }
    return queryBuilder;
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

  public async getSecondsSum(): Promise<number> {
    const result = await this.dataSource
      .getRepository(SongEntity)
      .createQueryBuilder('song')
      .select('SUM(seconds)', 'seconds')
      .getRawOne();
    return result['seconds'];
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

  public async getSongValues(columnName: string): Promise<ISelectableValue[]> {
    switch(columnName) {
      case DbColumn.Rating:
        return [
          { caption: '0', value: 0 },
          { caption: '1', value: 1 },
          { caption: '2', value: 2 },
          { caption: '3', value: 3 },
          { caption: '4', value: 4 },
          { caption: '5', value: 5 }];
      case DbColumn.Favorite:
      case DbColumn.Live:
      case DbColumn.Lyrics:
        return [{ caption: 'Yes', value: true }, { caption: 'No', value: false }];
    }
    const results = await this.dataSource
      .getRepository(SongEntity)
      .createQueryBuilder('song')
      .select(columnName)
      .distinct(true)
      .getRawMany();
    const items = results.map(result => {
      const item: ISelectableValue = {
        caption: result[columnName],
        value: result[columnName]
      };
      return item;
    });
    return this.utilities.sort(items, 'caption');
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
      const where = `moduleOption.name = :${parameterName}`;
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

  public getOptionArrayValue(moduleOption: ModuleOptionEntity): string[] {
    if (moduleOption.valueEditorType !== ModuleOptionEditor.Text) {
      // TODO:
    }
    return JSON.parse(moduleOption.values) as string[];
  }

  public getOptionBooleanValue(moduleOption: ModuleOptionEntity): boolean {
    if (moduleOption.valueEditorType !== ModuleOptionEditor.YesNo) {
      // TODO:
    }
    return JSON.parse(moduleOption.values) as boolean;
  }

  public getOptionTextValue(moduleOption: ModuleOptionEntity): string {
    if (moduleOption.valueEditorType !== ModuleOptionEditor.YesNo) {
      // TODO:
    }
    if (moduleOption.values) {
      return JSON.parse(moduleOption.values) as string;
    }
    return null;
  }

  public async saveModuleOptionText(name: ModuleOptionName, value: string): Promise<void> {
    const moduleOption = await ModuleOptionEntity.findOneBy({ name: name });
    if (moduleOption) {
      moduleOption.values = JSON.stringify(value);
      await moduleOption.save();
    }
  }

  public selector(columnName: string): ICriteriaValueSelector {
    return this.valueSelectors[columnName];
  }

  private setValueSelectors(): void {
    this.valueSelectors[DbColumn.Rating] = {
      column: databaseColumns[DbColumn.Rating],
      editor: CriteriaValueEditor.Multiple,
      getValues: () => {
        return Promise.resolve([
          { caption: '0', value: 0 },
          { caption: '1', value: 1 },
          { caption: '2', value: 2 },
          { caption: '3', value: 3 },
          { caption: '4', value: 4 },
          { caption: '5', value: 5 }
        ]);
      },
      values: [],
    };

    this.valueSelectors[DbColumn.Mood] = {
      column: databaseColumns[DbColumn.Mood],
      editor: CriteriaValueEditor.Multiple,
      getValues: () => {
        return this.getSongValues(DbColumn.Mood);
      },
      values: [],
    };

    this.valueSelectors[DbColumn.Language] = {
      column: databaseColumns[DbColumn.Language],
      editor: CriteriaValueEditor.Multiple,
      getValues: () => {
        return this.getSongValues(DbColumn.Language);
      },
      values: [],
    };

    this.valueSelectors[DbColumn.Favorite] = {
      column: databaseColumns[DbColumn.Favorite],
      editor: CriteriaValueEditor.YesNo,
      getValues: () => {
        return Promise.resolve([
          { caption: 'Yes', value: true },
          { caption: 'No', value: false }
        ]);
      },
      values: [],
    };

    this.valueSelectors[DbColumn.Live] = {
      column: databaseColumns[DbColumn.Live],
      editor: CriteriaValueEditor.YesNo,
      getValues: () => {
        return Promise.resolve([
          { caption: 'Yes', value: true },
          { caption: 'No', value: false }
        ]);
      },
      values: [],
    };

    this.valueSelectors[DbColumn.ReleaseDecade] = {
      column: databaseColumns[DbColumn.ReleaseDecade],
      editor: CriteriaValueEditor.Multiple,
      getValues: () => {
        return this.getSongValues(DbColumn.ReleaseDecade);
      },
      values: [],
    };

    this.valueSelectors[DbColumn.Lyrics] = {
      column: databaseColumns[DbColumn.Lyrics],
      editor: CriteriaValueEditor.YesNo,
      getValues: () => {
        return Promise.resolve([
          { caption: 'Yes', value: true },
          { caption: 'No', value: false }
        ]);
      },
      values: [],
    };

    // Fake sort by column
    this.valueSelectors[DbColumn.SortBy] = {
      column: databaseColumns[DbColumn.SortBy],
      editor: CriteriaValueEditor.Multiple,
      getValues: () => {
        return Promise.resolve([
          { caption: databaseColumns[DbColumn.TrackNumber].caption, value: DbColumn.TrackNumber },
          { caption: databaseColumns[DbColumn.MediaNumber].caption, value: DbColumn.MediaNumber },
          { caption: databaseColumns[DbColumn.Title].caption, value: DbColumn.Title },
          { caption: databaseColumns[DbColumn.TitleSort].caption, value: DbColumn.TitleSort },
          { caption: databaseColumns[DbColumn.Rating].caption, value: DbColumn.Rating },
          { caption: databaseColumns[DbColumn.PlayCount].caption, value: DbColumn.PlayCount },
          { caption: databaseColumns[DbColumn.Seconds].caption, value: DbColumn.Seconds },
          { caption: databaseColumns[DbColumn.AlbumName].caption, value: DbColumn.AlbumName },
          { caption: databaseColumns[DbColumn.AlbumArtistName].caption, value: DbColumn.AlbumArtistName },
          { caption: databaseColumns[DbColumn.AddDate].caption, value: DbColumn.AddDate }
        ]);
      },
      values: [],
    };

    this.valueSelectors[DbColumn.Limit] = {
      column: databaseColumns[DbColumn.Limit],
      editor: CriteriaValueEditor.Single,
      defaultValue: 0,
      getValues: () => {
        return Promise.resolve([
          { caption: 'None', value: 0 },
          { caption: '100', value: 100 },
          { caption: '200', value: 200 },
          { caption: '300', value: 300 },
          { caption: '500', value: 500 },
          { caption: '1,000', value: 1000 },
        ]);
      },
      values: [],
    };

    this.valueSelectors[DbColumn.TransformAlgorithm] = {
      column: databaseColumns[DbColumn.TransformAlgorithm],
      editor: CriteriaValueEditor.Single,
      defaultValue: CriteriaTransformAlgorithm.None,
      getValues: () => {
        return Promise.resolve([
          { caption: 'None', value: CriteriaTransformAlgorithm.None },
          { caption: 'Alternate Artist', value: CriteriaTransformAlgorithm.AlternateArtist },
          { caption: 'Alternate Language', value: CriteriaTransformAlgorithm.AlternateLanguage }
        ]);
      },
      values: [],
    };
  }

  public comparison(criteriaComparison: CriteriaComparison): IComparison {
    return this.comparisons[criteriaComparison];
  }

  private setComparisons(): void {
    this.comparisons[CriteriaComparison.None] = {
      id: CriteriaComparison.None,
      text: '',
      caption: 'None',
      icon: ''
    };
    this.comparisons[CriteriaComparison.Equals] = {
      id: CriteriaComparison.Equals,
      text: '=',
      caption: 'Equals',
      icon: 'mdi-equal mdi'
    };
    this.comparisons[CriteriaComparison.NotEquals] = {
      id: CriteriaComparison.NotEquals,
      text: '<>',
      caption: 'Not Equals',
      icon: 'mdi-code-tags mdi'
    };
    this.comparisons[CriteriaComparison.GreaterThan] = {
      id: CriteriaComparison.GreaterThan,
      text: '>',
      caption: 'Greater Than',
      icon: 'mdi-greater-than mdi'
    };
    this.comparisons[CriteriaComparison.GreaterThanOrEqualTo] = {
      id: CriteriaComparison.GreaterThanOrEqualTo,
      text: '>=',
      caption: 'Greater Than Or Equal To',
      icon: 'mdi-greater-than-or-equal mdi'
    };
    this.comparisons[CriteriaComparison.LessThan] = {
      id: CriteriaComparison.LessThan,
      text: '<',
      caption: 'Less Than',
      icon: 'mdi-less-than mdi'
    };
    this.comparisons[CriteriaComparison.LessThanOrEqualTo] = {
      id: CriteriaComparison.LessThanOrEqualTo,
      text: '<=',
      caption: 'Less Than Or Equal To',
      icon: 'mdi-less-than-or-equal mdi'
    };
    this.comparisons[CriteriaComparison.Like] = {
      id: CriteriaComparison.Like,
      text: 'LIKE',
      caption: 'Like',
      icon: 'mdi-thumb-up-outline mdi'
    };
    this.comparisons[CriteriaComparison.NotLike] = {
      id: CriteriaComparison.NotLike,
      text: 'NOT LIKE',
      caption: 'Not Like',
      icon: 'mdi-thumb-down-outline mdi'
    };
    this.comparisons[CriteriaComparison.IsNull] = {
      id: CriteriaComparison.IsNull,
      text: 'IS NULL',
      caption: 'Is Null',
      icon: 'mdi-circle-outline mdi'
    };
    this.comparisons[CriteriaComparison.IsNotNull] = {
      id: CriteriaComparison.IsNotNull,
      text: 'IS NOT NULL',
      caption: 'Is Not Null',
      icon: 'mdi-circle-off-outline mdi'
    };
  }

  public async updatePlayCount(songData: ISongModel): Promise<SongEntity> {
    // Increase play count
    const song = await SongEntity.findOneBy({ id: songData.id });
    song.playCount = songData.playCount;
    song.playDate = songData.playDate;
    await song.save();
    // Add play record
    const playRecord = new PlayHistoryEntity();
    playRecord.songId = songData.id;
    playRecord.playDate = song.playDate;
    await playRecord.save();
    return song;
  }

  public async setFavoriteSong(songId: string, favorite: boolean): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.favorite = favorite;
    await song.save();
  }

  public async setRating(songId: string, rating: number): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.rating = rating;
    await song.save();
  }

  public async setLive(songId: string, live: boolean): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.live = live;
    await song.save();
  }

  public async setMood(songId: string, mood: string): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.mood = mood;
    await song.save();
  }

  public getDefaultData(): Promise<object> {
    return new Promise<object>(resolve => {
      const fileUrl = 'assets/json/app.data.json';
      this.http.get(fileUrl).subscribe(data => {
        resolve(data);
      }, () => {
        this.log.warn('Could not load the data file: ' + fileUrl);
        resolve(null);
      });
    });
  }
}
