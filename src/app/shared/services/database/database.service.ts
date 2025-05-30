import { Injectable } from '@angular/core';
import {
  Brackets,
  DataSource,
  EntityTarget,
  InsertResult,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
  DataSourceOptions,
  EntityMetadata,
  WhereExpressionBuilder
} from 'typeorm';
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
  SongClassificationEntity,
  PlayHistoryEntity,
  SongClassificationViewEntity,
  PlaylistViewEntity,
  ValueListTypeEntity,
  ValueListEntryEntity,
  DataSourceEntity,
  DataMappingEntity,
  PartyRelationEntity,
  FilterEntity,
  FilterCriteriaEntity,
  FilterCriteriaItemEntity,
  SyncProfileEntity,
  SongExportEntity,
  SongExtendedViewEntity,
  SongExtendedByArtistViewEntity,
  SongExtendedByClassificationViewEntity,
  SongExtendedByPlaylistViewEntity,
  SongExpExtendedViewEntity,
  SongExpExtendedByArtistViewEntity,
  SongExpExtendedByClassificationViewEntity,
  SongExpExtendedByPlaylistViewEntity
} from '../../entities';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { databaseColumns } from './database.columns';
import { Criteria, CriteriaItem, CriteriaItems } from '../criteria/criteria.class';
import { CriteriaComparison, CriteriaJoinOperator, CriteriaSortDirection, CriteriaTransformAlgorithm } from '../criteria/criteria.enum';
import { IComparison } from '../criteria/criteria.interface';
import { ListTransformService } from '../list-transform/list-transform.service';
import { RelatedImageEntity } from '../../entities/related-image.entity';
import { HttpClient } from '@angular/common/http';
import { ComposerViewEntity } from '../../entities/composer-view.entity';
import { DatabaseLookupService } from './database-lookup.service';
import { RelativeDateService } from '../relative-date/relative-date.service';
import { ICollection, IKeyValuePair, KeyValueGen } from 'src/app/core/models/core.interface';
import { LogLevel } from 'src/app/core/services/log/log.enum';
import { AppEvent } from 'src/app/app-events';

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
 * Specifies a column expression and an alias if needed for reference.
 */
export interface IColumnExpression {
  /** The expression can be the name of the column alone or name with an alias like: columnName AS myColumn. */
  expression: string;
  /** If the expression contains an alias, this should refer to the alias used in the expression. */
  alias?: string;
}

/**
 * Exposes properties used to perform a query and get results selecting only one column.
 */
export interface IColumnQuery {
  /** This is the initial criteria used to get a list of values to be used by the search. */
  criteria: Criteria;
  /** This property specifies the column that will be selected to get the values. */
  columnExpression: IColumnExpression;
  /** This is an optional comparison that can be used when building the final criteria. */
  comparison?: CriteriaComparison;
}

export interface IResultsIteratorOptions<T extends ObjectLiteral> {
  /** List of queries used to get a list of values to combine. */
  queries: IColumnQuery[];
  /** The total number of results to be retrieved on each result. */
  pageSize?: number;
  /** If you are  looking to split the result on smaller chunks you can use this value to specify the number of items for each chunk. */
  chunkSize?: number;
  /** The entity that will be used to query and get results. */
  entity: EntityTarget<T>;
  /** List of criteria items to be added to the criteria recently built. */
  extraCriteria?: CriteriaItem[];
  /**
   * Callback that is fired when a result is resolved.
   * The first argument is the object that contains the values used to perform the search.
   * The second argument is the result of the search.
   */
  onResult: (valuesObj: KeyValueGen<any>, items: T[]) => Promise<void>;
  /** Callback for overriding the logic that creates the criteria for each combination of values. */
  onBuildCriteria?: (valuesObj: KeyValueGen<any>) => Criteria;
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
  private comparisons: { [id: number]: IComparison} = { };
  /**
   * Maximum number of parameters in a single statement for SqlLite.
   * Just an internal constant to do the limit calculations
   */
  private SQLITE_MAX_VARIABLE_NUMBER = 32766;
  /** Global parameter index to be used when building the where clause. */
  private parameterIndex = 0;

  constructor(
    private utilities: UtilityService,
    private events: EventsService,
    private log: LogService,
    private lookupService: DatabaseLookupService,
    private transformService: ListTransformService,
    private relativeDateService: RelativeDateService,
    private http: HttpClient)
  {
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
        ComposerViewEntity,
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
        PartyRelationEntity,
        SongClassificationEntity,
        PlayHistoryEntity,
        ValueListTypeEntity,
        ValueListEntryEntity,
        RelatedImageEntity,
        DataSourceEntity,
        DataMappingEntity,
        FilterEntity,
        FilterCriteriaEntity,
        FilterCriteriaItemEntity,
        SyncProfileEntity,
        SongExportEntity,
        SongExtendedViewEntity,
        SongExtendedByArtistViewEntity,
        SongExtendedByClassificationViewEntity,
        SongExtendedByPlaylistViewEntity,
        SongExpExtendedViewEntity,
        SongExpExtendedByArtistViewEntity,
        SongExpExtendedByClassificationViewEntity,
        SongExpExtendedByPlaylistViewEntity
      ],
      synchronize: true,
      logging: this.getDbLogging()
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
    const defaultData = await this.getJsonData('app.data');
    await this.insertData(defaultData);
    const userData = await this.getJsonData('user.data');
    if (userData) {
      await this.insertData(userData);
      await this.updateData(userData);
    }
    this.log.info('Default data initialized.');
  }

  private findEntityMetadata(name: string): EntityMetadata {
    return this.dataSource.entityMetadatas.find(m => m.givenTableName === name);
  }

  /**
   * Inserts data into the database.
   * The input object should have the following format:
   * { "inserts": { "tableName": [{ "columnName": columnValue }] } }
   * Columns with the name: // are ignored since they are considered "json comments".
   * All "id" columns are auto populated with a new guid, unless they already have a value.
   * All "hash" columns are auto populated based on the "name" column, unless they already value a value.
   * All required columns must have a value.
   */
  private async insertData(defaultDataObj: object): Promise<void> {
    const tables = defaultDataObj['inserts'];
    if (!tables) {
      return;
    }
    
    for (const tableName of Object.keys(tables)) {
      const entities: any[] = [];
      const rows = tables[tableName];
      const entityMetadata = this.findEntityMetadata(tableName);
      for (const row of rows) {
        const entity = entityMetadata.create();
        for (const columnName of Object.keys(row)) {
          // Json comment data
          if (columnName === '//') {
            continue;
          }
          entity[columnName] = row[columnName];
        }
        if (!entity['id']) {
          entity['id'] = this.utilities.newGuid();
        }
        // Set hash if needed
        if (entityMetadata.columns.find(c => c.databaseName === 'hash') && !entity['hash']) {
          entity['hash'] = this.lookupService.hashValues([entity['name'].toLowerCase()]);
        }

        entities.push(entity);
      }
      await this.bulkInsertFromTable(tableName, entities);
    }
  }

  private async bulkInsertFromTable(tableName: string, entities: any[]): Promise<void> {
    const m = this.findEntityMetadata(tableName);
    await this.bulkInsert(m.target, entities);
  }

  /**
   * Updates existing data.
   * The input object should have the following format:
   * { "updates": { "tableName": [{ "id": "some-id", "columnName": columnValue }] } }
   * The id column is used to find the record to update; if the id is not available, it will use the name to find a match.
   * Columns with the name: // are ignored since they are considered "json comments".
   * Id columns are not updated.
   * Any other column can be updated.
   */
  private async updateData(defaultDataObj: object): Promise<void> {
    const tables = defaultDataObj['updates'];
    if (!tables) {
      return;
    }

    for (const tableName of Object.keys(tables)) {
      const entityMetadata = this.findEntityMetadata(tableName);
      const targetClass = entityMetadata.target;
      const rows = tables[tableName];
      for (const row of rows) {
        let recordToUpdate: any;
        // We will query by id or name
        if (row['id']) {
          recordToUpdate = await targetClass['findOneBy']({ id: row['id'] });
        }
        else if (row['name']) {
          recordToUpdate = await targetClass['findOneBy']({ name: row['name'] });
        }

        if (recordToUpdate) {
          for (const columnName of Object.keys(row)) {
            // Ignore comments and do not update ids
            if (columnName === '//' || columnName === 'id') {
              continue;
            }
            recordToUpdate[columnName] = row[columnName];
          }
          await recordToUpdate.save();
        }
      }
    }
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

  /**
   * Adds a new record to the database if the entity does not exist (based on its id).
   * @param entity The entity to be inserted in the database.
   * @returns The entity.
   */
  public async add<T extends DbEntity>(entity: T, entityType: typeof DbEntity): Promise<T> {
    // TODO: determine type from entity parameter
    const exists = await this.lookupService.exists(entity.id, entityType);
    if (exists) {
      return entity;
    }
    return entity.save();
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
      this.log.info('Empty bulk, aborting bulk insert.');
      return [];
    }
    // Clone the array to prevent altering the original argument
    const valuesClone = [...values];
    let bulkIndex = 0;
    while (valuesClone.length) {
      bulkIndex++;
      const items = valuesClone.splice(0, bulkInfo.bulkSize);
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
      this.log.info('Empty bulk, aborting bulk update.');
      return [];
    }
    // Clone the array to prevent altering the original argument
    const valuesClone = [...values];
    let bulkIndex = 0;
    while (valuesClone.length) {
      bulkIndex++;
      const items = valuesClone.splice(0, bulkInfo.bulkSize);
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

  public run(query: string, parameters?: any[]): Promise<any> {
    return this.dataSource.query(query, parameters);
  }

  public async getList<T extends ObjectLiteral>(entity: EntityTarget<T>, criteria: Criteria): Promise<T[]> {
    const entityTempName = 'getListEntity';
    const repo = this.dataSource.getRepository(entity);
    this.log.debug('getList criteria', criteria);
    const result = await this.createQuery(repo, entityTempName, criteria).getMany();
    return this.transform(result, criteria);
  }

  public async getColumnValues(entity: EntityTarget<any>, criteria: Criteria, columnExpression: IColumnExpression): Promise<any[]> {
    const repo = this.dataSource.getRepository(entity);
    const columnName = this.getColumnName(columnExpression);
    // TODO: instead of ignoring all columns, directly create the select statement using the column expression
    let columnNameFound = false;
    // Ignore columns
    for (const column of repo.metadata.columns) {
      if (column.databaseName === columnName) {
        columnNameFound = true;
        if (criteria.ignoredInSelect(columnName)) {
          this.utilities.throwError(`The main column '${columnName}' cannot be ignored in the select.`);
        }
      } else if (!criteria.ignoredInSelect(column.databaseName)) {
        const criteriaItem = new CriteriaItem(column.databaseName);
        criteriaItem.ignoreInSelect = true;
        criteria.searchCriteria.push(criteriaItem);
      }
    }
    if (!columnNameFound) {
      this.utilities.throwError(`The column '${columnName}' was not found in the metadata.`);
    }
    this.log.debug('getColumnValues criteria', criteria);
    const result = await this.createQuery(repo, null, criteria).getRawMany();
    return this.transform(result, criteria);
  }

  public getRepo<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return this.dataSource.getRepository(entity);
  }

  /**
   * Generates a list of values for each specified query;
   * then combines the values of one list with items of the other lists to generate multiple criteria;
   * each generated criteria is used to perform a search and return a result through a callback.
   */
  public async searchResultsIterator(options: IResultsIteratorOptions<any>): Promise<void> {
    const queryResultCollection: ICollection<string, any[]> = {
      items: []
    };

    // Gather results from all queries
    for (const query of options.queries) {
      const objectResults = await this.getColumnValues(options.entity, query.criteria, query.columnExpression);
      const columnName = this.getColumnName(query.columnExpression);
      // Convert objects to raw values
      const valueResults = objectResults.map(obj => obj[columnName]);
      queryResultCollection.items.push({
        key: columnName,
        value: valueResults
      });
    }

    await this.combine({}, queryResultCollection.items, async valuesObj => {
      let criteria: Criteria;
      if (options.onBuildCriteria) {
        criteria = options.onBuildCriteria(valuesObj);
      }
      else {
        // Automatically create criteria
        criteria = new Criteria();
        Object.keys(valuesObj).forEach(columnName => {
          // This is an internal value used to specified the page number
          if (columnName !== 'pageNumber') {
            criteria.searchCriteria.push(new CriteriaItem(columnName, valuesObj[columnName]));
          }
        });
        if (options.extraCriteria?.length) {
          options.extraCriteria.forEach(item => criteria.searchCriteria.push(item));
        }
      }
      // The criteria can be null if it comes from the onBuildCriteria;
      // if that's the case it means we don't want to process it so skip it
      if (criteria) {
        if (options.pageSize) {
          criteria.paging.pageSize = options.pageSize;
        }
        const results = await this.getList(options.entity, criteria);
        if (results.length) {
          if (options.chunkSize) {
            let pageNumber = 0;
            while (results.length) {
              pageNumber++;
              const newValuesObj = Object.assign({}, valuesObj);
              newValuesObj['pageNumber'] = pageNumber;
              const chunk = results.splice(0, options.chunkSize);
              await options.onResult(newValuesObj, chunk);
            }
          }
          else {
            await options.onResult(valuesObj, results);
          }
        }
        else {
          this.log.info('Combination yielded no results.', valuesObj);
        }
      }
    });
  }

  /**
   * Recursive routine that combines results from different queries and fires a callback for each combination.
   */
  private async combine(
    valuesObj: KeyValueGen<any>,
    queryResults: IKeyValuePair<string, any[]>[],
    onCombination: (valuesObj: any) => Promise<void>
  ): Promise<void> {
    const first = queryResults[0];
    const rest = queryResults.slice(1);
    for (const item of first.value) {
      // Clone the object, the original needs to be untouched because it will be used for all the iterations
      const newValuesObj = Object.assign({}, valuesObj);
      newValuesObj[first.key] = item;
      if (rest && rest.length) {
        await this.combine(newValuesObj, rest, onCombination);
      }
      else {
        await onCombination(newValuesObj);
      }
    }
  }

  // SQLite Build Query - START

  private createQuery<T>(
    repo: Repository<T>, entityAlias: string, criteria: Criteria
  ): SelectQueryBuilder<T> {
    let queryBuilder = repo.createQueryBuilder(entityAlias);

    if (!criteria.hasItems() && !criteria.random && !criteria.hasPaging()) {
      return queryBuilder;
    }

    this.buildSelect(queryBuilder, entityAlias, criteria, repo.metadata.columns);
    queryBuilder = this.buildWhere(queryBuilder, entityAlias, criteria);
    if (criteria.random) {
      queryBuilder = this.buildOrderByRandom(queryBuilder, criteria.paging.pageSize);
    }
    else {
      // Here we only send the sorting criteria, this is how we support this
      queryBuilder = this.buildOrderBy(queryBuilder, entityAlias, criteria.sortingCriteria);
    }
    return queryBuilder;
  }

  private buildSelect<T>(
    queryBuilder: SelectQueryBuilder<T>, entityAlias: string, criteria: Criteria, columns: ColumnMetadata[]
  ) {
    let hasColumns = false;
    for (const column of columns) {
      if (!criteria.ignoredInSelect(column.databaseName)) {
        const columnName = this.buildColumnName(column.databaseName, entityAlias);
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
    if (criteria.paging.distinct) {
      queryBuilder.distinct(criteria.paging.distinct);
    }
  }

  private buildWhere<T>(
    queryBuilder: SelectQueryBuilder<T>, entityAlias: string, criteria: Criteria
  ): SelectQueryBuilder<T> {
    const allCriteria = [criteria.systemCriteria, criteria.breadcrumbCriteria, criteria.userCriteria, criteria.searchCriteria, criteria.quickCriteria];
    let hasWhere = false;
    // The where clause is about to start, reset the index that will be used to create parameter names
    this.parameterIndex = 0;
    for (const criteria of allCriteria) {
      // This is safe guard since criteria should not have none comparisons
      const whereCriteria = criteria.getComparisons();
      if (whereCriteria.length) {
        if (hasWhere) {
          // All criteria will be joined with the AND operator since all criteria must be used to get the results
          queryBuilder = queryBuilder.andWhere(this.createFirstLevelBrackets(entityAlias, whereCriteria));
        }
        else {
          queryBuilder = queryBuilder.where(this.createFirstLevelBrackets(entityAlias, whereCriteria));
          hasWhere = true;
        }
      }
    }
    return queryBuilder;
  }

  /**
   * Creates the first level where expression that consists of different criteria columns joined together.
   */
  private createFirstLevelBrackets(entityAlias: string, whereCriteria: CriteriaItem[]): Brackets  {
    const result = new Brackets(qb1 => {
      let hasWhere = false;
      for (const criteriaItem of whereCriteria) {
        let whereBrackets: Brackets;
        if (criteriaItem.comparison === CriteriaComparison.IsNull || criteriaItem.comparison === CriteriaComparison.IsNotNull) {
          // Ignore column values for these operators
          whereBrackets = new Brackets(qb => {
            const columnName = this.buildColumnName(criteriaItem.columnName, entityAlias);
            qb.where(`${columnName} ${this.comparison(criteriaItem.comparison).text}`);
          });
        }
        else {
          whereBrackets = this.createSecondLevelBrackets(entityAlias, criteriaItem);
        }
        if (hasWhere) {
          // This operator will be determined by criteria item
          // The auto setting should be AND since most of the times you will need to join expressions with that operator
          // Is this Auto setting misleading? It always uses And and it never considers the Or operator.
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
  private createSecondLevelBrackets(entityAlias: string, criteriaItem: CriteriaItem): Brackets {
    const brackets = new Brackets(qb2 => {
      if (criteriaItem.isRelativeDate) {
        this.buildWhereForRelativeDate(qb2, entityAlias, criteriaItem);
      }
      else {
        this.buildWhereForColumnValues(qb2, entityAlias, criteriaItem);
      }
    });
    return brackets;
  }

  private buildWhereForColumnValues(builder: WhereExpressionBuilder, entityAlias: string, criteriaItem: CriteriaItem): void {
    // Typeorm requires unique parameters even if the column is the same
    let hasWhere = false;
    for (const valuePair of criteriaItem.columnValues) {
      this.parameterIndex++;
      const parameterName = criteriaItem.columnName + this.parameterIndex.toString();
      const columnName = this.buildColumnName(criteriaItem.columnName, entityAlias);
      const where = `${columnName} ${this.comparison(criteriaItem.comparison).text} :${parameterName}`;
      const parameter = {};
      parameter[parameterName] = valuePair.value;
      if (hasWhere) {
        if (criteriaItem.valuesOperator === CriteriaJoinOperator.Auto) {
          // when all values are using "NOT EQUALS" the operator should be AND
          if (criteriaItem.comparison === CriteriaComparison.NotEquals) {
            builder = builder.andWhere(where, parameter);
          }
          // For anything else use OR
          else {
            builder = builder.orWhere(where, parameter);
          }
        }
        else if (criteriaItem.valuesOperator === CriteriaJoinOperator.And) {
          builder = builder.andWhere(where, parameter);
        }
        else if (criteriaItem.valuesOperator === CriteriaJoinOperator.Or) {
          builder = builder.orWhere(where, parameter);
        }
      }
      else {
        builder = builder.where(where, parameter);
        hasWhere = true;
      }
    }
  }

  private buildWhereForRelativeDate(builder: WhereExpressionBuilder, entityAlias: string, criteriaItem: CriteriaItem): void {
    // We currently support only one relative date just because I don't see the need to support multiple
    // If we need to support multiple values, we need to, at least, assign unique indexes to the parameters
    const expressionText = criteriaItem.columnValues[0].value;
    const expression = this.relativeDateService.createExpression(expressionText);
    if (this.relativeDateService.isValid(expression)) {
      const dateRange = this.relativeDateService.parse(expression);
      const columnName = this.buildColumnName(criteriaItem.columnName, entityAlias);
      switch (criteriaItem.comparison) {
        // This will match the whole period
        case CriteriaComparison.Equals:
          builder = builder.where(`${columnName} >= :fromDate`, { fromDate: dateRange.from });
          builder = builder.andWhere(`${columnName} <= :toDate`, { toDate: dateRange.to });
          break;
        // This wil match any date outside the period
        case CriteriaComparison.NotEquals:
          builder = builder.where(`${columnName} < :fromDate`, { fromDate: dateRange.from });
          builder = builder.andWhere(`${columnName} > :toDate`, { toDate: dateRange.to });
          break;
        // This will match dates before the start of the period
        case CriteriaComparison.LessThan:
          builder = builder.where(`${columnName} < :fromDate`, { fromDate: dateRange.from });
          break;
        // This will match dates from the period and older
        case CriteriaComparison.LessThanOrEqualTo:
          builder = builder.where(`${columnName} <= :toDate`, { toDate: dateRange.to });
          break;
        // This will match dates after the end of the period
        case CriteriaComparison.GreaterThan:
          builder = builder.where(`${columnName} > :toDate`, { toDate: dateRange.to });
          break;
        // This will match dates from the period and newer
        case CriteriaComparison.GreaterThanOrEqualTo:
          builder = builder.where(`${columnName} >= :fromDate`, { fromDate: dateRange.from });
          break;
      }
    }
    else {
      this.log.warn('Invalid relative date expression: ' + expressionText, expression);
    }
  }

  private buildOrderBy<T>(
    queryBuilder: SelectQueryBuilder<T>, entityAlias: string, criteriaItems: CriteriaItems
  ): SelectQueryBuilder<T> {
    let hasOrderBy = false;
    // This is a safe guard since this should only receive sorting items
    const orderByCriteria = criteriaItems.filter(criteriaItem =>
      criteriaItem.sortSequence > 0 &&
      criteriaItem.sortDirection !== CriteriaSortDirection.Alternate);
    this.utilities.sort(orderByCriteria, 'sortSequence').forEach(orderByItem => {
      const columnName = this.buildColumnName(orderByItem.columnName, entityAlias);
      const order = orderByItem.sortDirection === CriteriaSortDirection.Ascending ? 'ASC' : 'DESC';
      if (hasOrderBy) {
        queryBuilder = queryBuilder.addOrderBy(columnName, order);
      }
      else {
        queryBuilder = queryBuilder.orderBy(columnName, order);
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

  /**
   * Changes the content and order of the specified list of items.
   */
  private transform<T>(items: T[], criteria: Criteria): T[] {
    let transformedResult = this.transformService.transform(items, criteria.transformAlgorithm);
    // Individual alternate transforms
    const transformCriteriaItems = criteria.sortingCriteria.filter(criteriaItem =>
      criteriaItem.sortSequence > 0 &&
      criteriaItem.sortDirection === CriteriaSortDirection.Alternate);
    if (transformCriteriaItems.length) {
      const propertyNames = this.utilities.sort(transformCriteriaItems, 'sequence').map(i => i.columnName);
      transformedResult = this.transformService.transform(
        transformedResult, CriteriaTransformAlgorithm.AlternateProperties, propertyNames);
    }
    return transformedResult;
  }

  // SQLite Build Query - END

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

  private getJsonData(fileName: string): Promise<object> {
    return new Promise<object>(resolve => {
      const fileUrl = `assets/json/${fileName}.json`;
      this.http.get(fileUrl).subscribe(data => {
        resolve(data);
      }, () => {
        this.log.warn('Could not load the data file: ' + fileUrl);
        resolve(null);
      });
    });
  }

  /**
   * Converts an existing entity into a different entity by using the properties in the
   * destination to get the values from the source.
   */
  public mapEntities<T extends ObjectLiteral>(source: any, destinationEntity: EntityTarget<T>): T {
    const repo = this.dataSource.getRepository(destinationEntity);
    const entityInstance = repo.metadata.create();
    for (const column of repo.metadata.columns) {
      // For now all column names match the property names, so we can do this logic
      const value = source[column.databaseName];
      if (value !== undefined) {
        entityInstance[column.databaseName] = value;
      }
    }
    return entityInstance as T;
  }

  private buildColumnName(columnName: string, entityAlias?: string): string {
    if (entityAlias) {
      return `${entityAlias}.${columnName}`;
    }
    return columnName;
  }

  private getColumnName(expression: IColumnExpression): string {
    return expression.alias ? expression.alias : expression.expression;
  }

  private getDbLogging(): any {
    let logging: any;
    switch (this.log.level) {
      case LogLevel.Verbose:
        logging = ['query', 'error', 'warn', 'schema', 'info', 'log'];
        break;
      case LogLevel.Info:
        logging = ['error', 'warn', 'info'];
        break;
      case LogLevel.Warning:
        logging = ['error', 'warn'];
        break;
      default:
        logging = ['error'];
        break;
    }
    return logging;
  }
}
