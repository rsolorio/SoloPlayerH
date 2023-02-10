import { Injectable } from '@angular/core';
import { Brackets, DataSource, DataSourceOptions, EntityTarget, InsertResult, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import * as objectHash from 'object-hash'
import { IClassificationModel } from '../../models/classification-model.interface';
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
import { databaseColumns, DbColumn } from './database.columns';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { Criteria, CriteriaItem, CriteriaItems } from '../criteria/criteria.class';
import { CriteriaComparison, CriteriaJoinOperator, CriteriaSortDirection, CriteriaTransformAlgorithm, CriteriaValueEditor } from '../criteria/criteria.enum';
import { IComparison, ICriteriaValueSelector } from '../criteria/criteria.interface';
import { ListTransformService } from '../list-transform/list-transform.service';

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
   * Maximum number of parameters in a single statement.
   * Just an internal constant to do the limit calculations
   */
  private SQLITE_MAX_VARIABLE_NUMBER = 32766;

  constructor(
    private utilities: UtilityService,
    private events: EventsService,
    private log: LogService,
    private transformService: ListTransformService) {
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
    this.setValueSelectors();
    this.setComparisons();
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
    // Here we only send the sorting criteria, this is how we support this
    queryBuilder = this.buildOrderBy(queryBuilder, entityName, criteria.sortingCriteria);
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
    // This is a sage guard since this should only receive sorting items
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

  public selector(columnName: string): ICriteriaValueSelector {
    return this.valueSelectors[columnName];
  }

  private setValueSelectors(): void {
    this.valueSelectors[DbColumn.Rating] = {
      column: databaseColumns[DbColumn.Rating],
      editor: CriteriaValueEditor.Multiple,
      values: [],
      getValues: () => {
        return Promise.resolve([
          { caption: '0', value: 0 },
          { caption: '1', value: 1 },
          { caption: '2', value: 2 },
          { caption: '3', value: 3 },
          { caption: '4', value: 4 },
          { caption: '5', value: 5 }
        ]);
      }
    };

    this.valueSelectors[DbColumn.Mood] = {
      column: databaseColumns[DbColumn.Mood],
      editor: CriteriaValueEditor.Multiple,
      values: [],
      getValues: () => {
        return this.getSongValues(DbColumn.Mood);
      }
    };

    this.valueSelectors[DbColumn.Language] = {
      column: databaseColumns[DbColumn.Language],
      editor: CriteriaValueEditor.Multiple,
      values: [],
      getValues: () => {
        return this.getSongValues(DbColumn.Language);
      }
    };

    this.valueSelectors[DbColumn.Favorite] = {
      column: databaseColumns[DbColumn.Favorite],
      editor: CriteriaValueEditor.YesNo,
      values: [],
      getValues: () => {
        return Promise.resolve([
          { caption: 'Yes', value: true },
          { caption: 'No', value: false }
        ]);
      }
    };

    this.valueSelectors[DbColumn.ReleaseDecade] = {
      column: databaseColumns[DbColumn.ReleaseDecade],
      editor: CriteriaValueEditor.Multiple,
      values: [],
      getValues: () => {
        return this.getSongValues(DbColumn.ReleaseDecade);
      }
    };

    this.valueSelectors[DbColumn.Lyrics] = {
      column: databaseColumns[DbColumn.Lyrics],
      editor: CriteriaValueEditor.YesNo,
      values: [],
      getValues: () => {
        return Promise.resolve([
          { caption: 'Yes', value: true },
          { caption: 'No', value: false }
        ]);
      }
    };

    // Fake sort by column
    this.valueSelectors[DbColumn.SortBy] = {
      column: databaseColumns[DbColumn.SortBy],
      editor: CriteriaValueEditor.Multiple,
      values: [],
      getValues: () => {
        return Promise.resolve([
          { caption: databaseColumns[DbColumn.TrackNumber].caption, value: DbColumn.TrackNumber },
          { caption: databaseColumns[DbColumn.MediaNumber].caption, value: DbColumn.MediaNumber },
          { caption: databaseColumns[DbColumn.Title].caption, value: DbColumn.Title },
          { caption: databaseColumns[DbColumn.Rating].caption, value: DbColumn.Rating },
          { caption: databaseColumns[DbColumn.PlayCount].caption, value: DbColumn.PlayCount },
          { caption: databaseColumns[DbColumn.Seconds].caption, value: DbColumn.Seconds },
          { caption: databaseColumns[DbColumn.AlbumName].caption, value: DbColumn.AlbumName },
          { caption: databaseColumns[DbColumn.AlbumArtistName].caption, value: DbColumn.AlbumArtistName },
        ]);
      }
    };

    this.valueSelectors[DbColumn.TransformAlgorithm] = {
      column: databaseColumns[DbColumn.TransformAlgorithm],
      editor: CriteriaValueEditor.Single,
      values: [],
      getValues: () => {
        return Promise.resolve([
          { caption: 'None', value: CriteriaTransformAlgorithm.None },
          { caption: 'Alternate Artist', value: CriteriaTransformAlgorithm.AlternateArtist },
          { caption: 'Alternate Language', value: CriteriaTransformAlgorithm.AlternateLanguage }
        ]);
      }
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
}
