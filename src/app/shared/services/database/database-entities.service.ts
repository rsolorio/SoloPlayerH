import { Injectable } from '@angular/core';
import { AlbumEntity, ArtistEntity, DataMappingEntity, DataSourceEntity, FilterEntity, PlayHistoryEntity, PlaylistEntity, PlaylistSongEntity, PlaylistSongViewEntity, RelatedImageEntity, SongEntity, SyncProfileEntity, ValueListEntryEntity } from '../../entities';
import { ISongModel } from '../../models/song-model.interface';
import { IsNull, Not } from 'typeorm';
import { ICriteriaValueSelector } from '../criteria/criteria.interface';
import { DbColumn, databaseColumns } from './database.columns';
import { ChipDisplayMode, ChipSelectorType, IChipItem, IChipSelectionModel } from '../../components/chip-selection/chip-selection-model.interface';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { CriteriaComparison, CriteriaJoinOperator, CriteriaSortDirection, CriteriaTransformAlgorithm } from '../criteria/criteria.enum';
import { DatabaseService } from './database.service';
import { Criteria, CriteriaItem, CriteriaItems } from '../criteria/criteria.class';
import { FilterCriteriaEntity } from '../../entities/filter-criteria.entity';
import { FilterCriteriaItemEntity } from '../../entities/filter-criteria-item.entity';
import { IFilterModel } from '../../models/filter-model.interface';
import { ChipSelectionComponent } from '../../components/chip-selection/chip-selection.component';
import { DatabaseOptionsService } from './database-options.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ValueLists } from './database.lists';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { ModuleOptionId } from './database.seed';
import { ISyncProfile, ISyncProfileParsed, SyncType } from '../../models/sync-profile-model.interface';
import { IPlaylistSongModel } from '../../models/playlist-song-model.interface';
import { IDataSourceParsed } from 'src/app/mapping/data-source/data-source.interface';
import { PartyRelationType } from '../../models/music.enum';
import { FileService } from 'src/app/platform/file/file.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { LocalStorageKeys } from '../local-storage/local-storage.enum';

@Injectable({
  providedIn: 'root'
})
export class DatabaseEntitiesService {

  constructor(
    private utilities: UtilityService,
    private db: DatabaseService,
    private options: DatabaseOptionsService,
    private fileService: FileService,
    private storage: LocalStorageService,
    private sidebarHostService: SideBarHostStateService) { }

  public getSongsFromArtist(artistId: string): Promise<SongEntity[]> {
    return SongEntity
      .getRepository()
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
  public getSongsFromAlbumArtist(artistId: string): Promise<SongEntity[]> {
    return SongEntity
      .getRepository()
      .createQueryBuilder('song')
      .innerJoinAndSelect('song.primaryAlbum', 'album')
      .innerJoinAndSelect('album.primaryArtist', 'artist')
      .where('artist.id = :artistId')
      .setParameter('artistId', artistId)
      .getMany();
  }

  public async getSecondsSum(): Promise<number> {
    const result = await SongEntity
      .getRepository()
      .createQueryBuilder('song')
      .select('SUM(seconds)', 'seconds')
      .getRawOne();
    return result['seconds'];
  }

  public async updatePlayCount(songData: ISongModel): Promise<SongEntity> {
    // This particular functionality will be disabled when debug is on.
    const debugMode = this.storage.getByKey(LocalStorageKeys.DebugMode);
    if (debugMode) {
      return null;
    }
    // Increase play count
    const song = await SongEntity.findOneBy({ id: songData.id });
    song.playCount = songData.playCount;
    song.playDate = songData.playDate;
    song.changeDate = new Date();
    await song.save();
    // Add play record
    const playRecord = new PlayHistoryEntity();
    playRecord.songId = songData.id;
    playRecord.playDate = song.playDate;
    await playRecord.save();
    return song;
  }

  public async setFavoriteSong(songId: string, favorite: boolean): Promise<boolean> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.favorite = favorite;
    song.changeDate = new Date();
    await song.save();
    return favorite;
  }

  public async setFavoriteAlbum(albumId: string, favorite: boolean): Promise<boolean> {
    const album = await AlbumEntity.findOneBy({ id: albumId });
    album.favorite = favorite;
    await album.save();
    return favorite;
  }

  public async setFavoriteArtist(artistId: string, favorite: boolean): Promise<boolean> {
    const artist = await ArtistEntity.findOneBy({ id: artistId });
    artist.favorite = favorite;
    await artist.save();
    return favorite;
  }

  public async setFavoritePlaylist(playlistId: string, favorite: boolean): Promise<boolean> {
    const playlist = await PlaylistEntity.findOneBy({ id: playlistId });
    playlist.favorite = favorite;
    await playlist.save();
    return favorite;
  }

  public async setFavoriteFilter(filterId: string, favorite: boolean): Promise<boolean> {
    const filter = await FilterEntity.findOneBy({ id: filterId });
    filter.favorite = favorite;
    await filter.save();
    return favorite;
  }

  public async setRating(songId: string, rating: number): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.rating = rating;
    song.changeDate = new Date();
    await song.save();
  }

  public async setLive(songId: string, live: boolean): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.live = live;
    song.changeDate = new Date();
    await song.save();
  }

  public async setMood(songId: string, mood: string): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.mood = mood;
    song.changeDate = new Date();
    await song.save();
  }

  public async setChangeDate(songId: string): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.changeDate = new Date();
    await song.save();
  }

  public hasLyricsFile(song: ISongModel): boolean {
    const lyricsFilePath = song.filePath.replace(song.fileExtension, 'txt');
    return this.fileService.exists(lyricsFilePath);
  }

  public async consumeLyrics(songFilePath: string): Promise<string> {
    // TODO: consolidate this logic with the one in the file info data source
    const fileInfo = await this.fileService.getFileInfo(songFilePath);
    const lyricsFilePath = fileInfo.path.replace(fileInfo.extension, '.txt');
    if (this.fileService.exists(lyricsFilePath)) {
      const lyrics = await this.fileService.getText(lyricsFilePath);
      if (lyrics) {
        const song = await SongEntity.findOneBy({ filePath: songFilePath });
        if (song.lyrics !== lyrics) {
          song.lyrics = lyrics;
          await song.save();
          return lyrics;
        }
      }
    }
    return null;
  }

  public getSongDetails(songId: string): Promise<any> {
    return SongEntity
      .getRepository()
      .createQueryBuilder('song')
      .innerJoin('album', 'album', 'song.primaryAlbumId = album.id')
      .innerJoin('artist', 'artist', 'album.primaryArtistId = artist.id')
      .addSelect('album.name', 'primaryAlbumName')
      .addSelect('artist.name', 'primaryArtistName')
      .where('song.id = :songId')
      .setParameter('songId', songId)
      .getRawOne();
  }

  /**
   * Get the tracks from the specified playlist ordered by sequence.
   */
  public getTracks(playlistId: string): Promise<IPlaylistSongModel[]> {
    const criteria = new Criteria();
    criteria.searchCriteria.push(new CriteriaItem('playlistId', playlistId));
    criteria.addSorting('sequence');
    return this.db.getList(PlaylistSongViewEntity, criteria);
  }

  /**
   * Gets a list of artistId/songId/artistName records where the relation type is
   * Featuring or Contributor or Singer.
   */
  public getNonPrimaryRelations(): Promise<any[]> {
    // TODO: create interface or entity for this query
    const nonPrimaryRelationsQuery = `
      SELECT partyRelation.artistId, partyRelation.songId, artist.name AS artistName
      FROM partyRelation
      INNER JOIN artist
      ON partyRelation.relatedId = artist.id
      WHERE relationTypeId = '${PartyRelationType.Featuring}'
      OR relationTypeId = '${PartyRelationType.Contributor}'
      OR relationTypeId = '${PartyRelationType.Singer}'
    `;
    return this.db.run(nonPrimaryRelationsQuery);
  }

  public getAssociatedArtists(): Promise<any[]> {
    const associatedArtistsQuery = `
      SELECT associatedArtist.name AS associatedArtistName, primaryArtist.name AS primaryArtistName, partyRelation.relationTypeId
      FROM partyRelation
      INNER JOIN artist AS primaryArtist
      ON partyRelation.artistId = primaryArtist.id
      INNER JOIN artist AS associatedArtist
      ON partyRelation.relatedId = associatedArtist.id
      WHERE relationTypeId = '${PartyRelationType.Singer}'
      OR relationTypeId = '${PartyRelationType.Contributor}'
    `;
    return this.db.run(associatedArtistsQuery);
  }

  public async exportColorSelectionData(): Promise<any> {
    const result: any = {};
    const images = await RelatedImageEntity.findBy({ colorSelection: Not(IsNull()) });
    result['relatedImage'] = images.map(i => {
      return {
        hash: i.hash,
        colorSelection: i.colorSelection
      };
    });
    return result;
  }

  public async getSongValues(columnName: string): Promise<IChipItem[]> {
    switch(columnName) {
      case DbColumn.Rating:
        return [
          { caption: '0', value: 0,
            middleIcons: [AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff] },
          { caption: '1', value: 1,
            middleIcons: [AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff] },
          { caption: '2', value: 2,
            middleIcons: [AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff] },
          { caption: '3', value: 3,
            middleIcons: [AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOff, AppAttributeIcons.RatingOff] },
          { caption: '4', value: 4,
            middleIcons: [AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOff] },
          { caption: '5', value: 5,
            middleIcons: [AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn, AppAttributeIcons.RatingOn] }];
      case DbColumn.Favorite:
      case DbColumn.Live:
      case DbColumn.Lyrics:
        return [{ caption: 'Yes', value: true }, { caption: 'No', value: false }];
    }
    const criteria = new Criteria();
    criteria.paging.distinct = true;
    const results = await this.db.getColumnValues(SongEntity, criteria, { expression: columnName });
    
    const items = results.map(result => {
      const item: ISelectableValue = {
        caption: result[columnName],
        value: result[columnName]
      };
      return item;
    });
    return this.utilities.sort(items, 'caption');
  }

  public async createSelector(columnName: string): Promise<ICriteriaValueSelector> {
    // Create a default yes/no selector
    const result: ICriteriaValueSelector = {
      column: databaseColumns[columnName],
      type: ChipSelectorType.YesNo,
      values: [
        { caption: 'Yes', value: true },
        { caption: 'No', value: false }
      ]
    };
    switch (columnName) {
      case DbColumn.Rating:
        result.type = ChipSelectorType.MultipleOk;
        result.values = [
          { caption: '0', value: 0 },
          { caption: '1', value: 1 },
          { caption: '2', value: 2 },
          { caption: '3', value: 3 },
          { caption: '4', value: 4 },
          { caption: '5', value: 5 }
        ];
        break;
      case DbColumn.Mood:
      case DbColumn.Language:
      case DbColumn.ReleaseDecade:
        result.type = ChipSelectorType.MultipleOk;
        result.values = await this.getSongValues(columnName);
        break;
      case DbColumn.SortBy:
        result.type = ChipSelectorType.MultipleOk;
        result.values = [
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
        ];
        break;
      case DbColumn.Limit:
        result.type = ChipSelectorType.SingleOk;
        result.defaultValue = 0;
        result.values = [
          { caption: 'None', value: 0 },
          { caption: '100', value: 100 },
          { caption: '200', value: 200 },
          { caption: '300', value: 300 },
          { caption: '500', value: 500 },
          { caption: '1,000', value: 1000 },
        ];
        break;
      case DbColumn.TransformAlgorithm:
        result.type = ChipSelectorType.SingleOk;
        result.defaultValue = CriteriaTransformAlgorithm.None;
        result.values = [
          { caption: 'None', value: CriteriaTransformAlgorithm.None },
          { caption: 'Shuffle Artist', value: CriteriaTransformAlgorithm.ShuffleArtist },
          { caption: 'Shuffle Language', value: CriteriaTransformAlgorithm.ShuffleLanguage }
        ];
        break;
    }
    return result;
  }

  public parseSyncProfile(entity: ISyncProfile): ISyncProfileParsed {
    const result = entity as ISyncProfileParsed;
    result.directoryArray = entity.directories ? JSON.parse(entity.directories) : null;
    result.configObj = entity.config ? JSON.parse(entity.config) : null;
    result.syncInfoObj = entity.syncInfo ? JSON.parse(entity.syncInfo) : null;
    return result;
  }

  public async getSyncProfiles(syncType: SyncType): Promise<ISyncProfileParsed[]> {
    const result: ISyncProfileParsed[] = [];
    const profiles = await SyncProfileEntity.findBy({ syncType: syncType });
    profiles.forEach(p => result.push(this.parseSyncProfile(p)));
    return result;
  }

  public async getSyncProfile(id: string): Promise<ISyncProfileParsed> {
    const entity = await SyncProfileEntity.findOneBy({ id: id });
    return this.parseSyncProfile(entity);
  }

  public async saveSyncProfile(data: ISyncProfileParsed): Promise<void> {
    const syncProfile = await SyncProfileEntity.findOneBy({ id: data.id });
    syncProfile.directories = data.directoryArray ? JSON.stringify(data.directoryArray) : null;
    syncProfile.config = data.configObj ? JSON.stringify(data.configObj) : null;
    syncProfile.syncInfo = data.syncInfoObj ? JSON.stringify(data.syncInfoObj) : null;
    syncProfile.syncDate = data.syncDate;
    await syncProfile.save();
  }

  public async getDataSources(profileId: string): Promise<IDataSourceParsed[]> {
    const result: IDataSourceParsed[] = [];
    const sourceData = await DataSourceEntity.findBy({ profileId: profileId });
    const sortedSources = this.utilities.sort(sourceData, 'sequence');
    for (const sourceRow of sortedSources) {
      if (!sourceRow.disabled) {
        result.push({
          id: sourceRow.id,
          type: sourceRow.type,
          config: sourceRow.config ? JSON.parse(sourceRow.config) : null,
          fieldArray: sourceRow.fields ? sourceRow.fields.split(',') : null,
          sequence: sourceRow.sequence,
          disabled: sourceRow.disabled,
          mappings: await DataMappingEntity.findBy({ dataSourceId: sourceRow.id })
        });
      }
    }
    return result;
  }

  public async updateFilterAccessDate(filterId: string): Promise<void> {
    const filter = await FilterEntity.findOneBy({ id: filterId });
    filter.accessDate = new Date();
    await filter.save();
  }

  public async getCriteriaFromFilterId(filterId: string): Promise<Criteria> {
    const filter = await FilterEntity.findOneBy({ id: filterId });
    return this.getCriteriaFromFilter(filter);
  }

  public async getCriteriaFromFilter(filter: IFilterModel): Promise<Criteria> {
    const filterCriteria = await FilterCriteriaEntity.findOneBy({ id: filter.filterCriteriaId });
    const filterCriteriaItems = await FilterCriteriaItemEntity.findBy({ filterCriteriaId: filter.filterCriteriaId });
    const result = new Criteria();
    result.id = filterCriteria.id;
    result.name = filter.name;
    result.filterId = filter.id;
    result.paging.distinct = filterCriteria.distinct;
    result.paging.pageSize = filterCriteria.limit;
    result.random = filterCriteria.random;
    result.transformAlgorithm = filter.transformAlgorithm;

    for (const filterCriteriaItem of filterCriteriaItems) {
      // Find existing criteria item
      let criteriaItem: CriteriaItem;
      if (filterCriteriaItem.sortSequence === 0) {
        criteriaItem = result.searchCriteria.find(i => i.columnName === filterCriteriaItem.columnName);
      }
      else {
        criteriaItem = result.sortingCriteria.find(i => i.columnName === filterCriteriaItem.columnName);
      }
      
      if (!criteriaItem) {
        criteriaItem = new CriteriaItem(filterCriteriaItem.columnName);
        criteriaItem.id = filterCriteriaItem.id;
        criteriaItem.comparison = filterCriteriaItem.comparison;
        criteriaItem.valuesOperator = filterCriteriaItem.valuesOperator;
        criteriaItem.expressionOperator = filterCriteriaItem.expressionOperator;
        criteriaItem.sortDirection = filterCriteriaItem.sortDirection;
        criteriaItem.sortSequence = filterCriteriaItem.sortSequence;
        criteriaItem.ignoreInSelect = filterCriteriaItem.ignoreInSelect;
        criteriaItem.isRelativeDate = filterCriteriaItem.isRelativeDate;
        if (filterCriteriaItem.displayName) {
          criteriaItem.displayName = filterCriteriaItem.displayName;
        }
        if (filterCriteriaItem.displayValue) {
          criteriaItem.displayValue = filterCriteriaItem.displayValue;
        }

        // We assume search and sorting criteria about the same field come
        // in different criteria items.
        if (criteriaItem.sortSequence > 0) {
          result.sortingCriteria.push(criteriaItem);
        }
        else {
          result.searchCriteria.push(criteriaItem);
        }
      }
      if (filterCriteriaItem.columnValue) {
        criteriaItem.columnValues.push({ value: filterCriteriaItem.columnValue});
      }
    }
    return result;
  }

  public async getRelatedImage(relatedIds: string[]): Promise<RelatedImageEntity> {
    let result: RelatedImageEntity;
    for (const relatedId of relatedIds) {
      const images = await RelatedImageEntity.findBy({ relatedId: relatedId });
      if (images && images.length) {
        result = images[0];
        break;
      }
    }
    return result;
  }

  public getQuickFilterPanelModel(chips: IChipItem[], subTitle: string, subTitleIcon: string): IChipSelectionModel {
    const multipleEnabled = this.options.getBoolean(ModuleOptionId.AllowMultipleQuickFilters);
    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Quick Filters',
      titleIcon: AppActionIcons.Filter,
      subTitle: subTitle,
      subTitleIcon: subTitleIcon,
      displayMode: ChipDisplayMode.Block,
      type: multipleEnabled ? ChipSelectorType.MultipleOk : ChipSelectorType.Quick,
      okDelay: multipleEnabled ? 0 : 300,
      items: chips,
      okHidden: !multipleEnabled,
      actions: [{
        caption: 'Clear',
        action: (iconAction, result) => {
          const model = result as IChipSelectionModel;
          model.items.forEach(v => v.selected = false);
          if (!multipleEnabled) {
            this.sidebarHostService.closeOk();
          }
        }
      }]
    };
    return result;
  }

  private addQuickFilterChip(
    id: string,
    columnName: string,
    columnValue: any,
    comparison: CriteriaComparison,
    icon: string,
    caption: string,
    chips: IChipItem[],
    criteriaItems: CriteriaItems): void
  {
    const criteriaItem = new CriteriaItem(columnName, columnValue);
    criteriaItem.id = id;
    criteriaItem.comparison = comparison;
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    chips.push({
      sequence: chips.length + 1,
      icon: icon,
      caption: caption,
      value: criteriaItem,
      selected: !!criteriaItems.find(c => c.id === id)
    });
  }

  public getQuickFiltersForSongs(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addQuickFilterChip('quickFilter-favorite', 'favorite', true, CriteriaComparison.Equals, AppAttributeIcons.FavoriteOn, 'Favorite', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-playCount', 'playCount', 0, CriteriaComparison.Equals, AppAttributeIcons.PlayCount, 'Not Played', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-lyrics', 'lyrics', undefined, CriteriaComparison.IsNotNull, AppAttributeIcons.LyricsOn, 'Has Lyrics', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-ratingTop', 'rating', 5, CriteriaComparison.Equals, AppAttributeIcons.RatingOn, 'Top Rated', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-ratingHigh', 'rating', 4, CriteriaComparison.GreaterThanOrEqualTo, AppAttributeIcons.RatingHalf, 'High Rated', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-live', 'live', true, CriteriaComparison.Equals, AppAttributeIcons.LiveOn, 'Live', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-explicit', 'explicit', true, CriteriaComparison.Equals, AppAttributeIcons.ExplicitOn, 'Explicit', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-performerCount', 'performerCount', 1, CriteriaComparison.GreaterThan, AppAttributeIcons.PerformerCount, 'Multi Artist', result, existingCriteria.quickCriteria);
    return result;
  }

  public getQuickFiltersForArtists(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addQuickFilterChip('quickFilter-favorite', 'favorite', true, CriteriaComparison.Equals, AppAttributeIcons.FavoriteOn, 'Favorite', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-playCount', 'playCount', 0, CriteriaComparison.Equals, AppAttributeIcons.PlayCount, 'Not Played', result, existingCriteria.quickCriteria);
    const longPlaySongCount = this.options.getNumber(ModuleOptionId.LongPlayArtistThreshold);
    this.addQuickFilterChip('quickFilter-songCount', 'songCount', longPlaySongCount, CriteriaComparison.GreaterThanOrEqualTo, AppAttributeIcons.LongPlay, 'Long Play', result, existingCriteria.quickCriteria);
    return result;
  }

  public getQuickFiltersForAlbums(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addQuickFilterChip('quickFilter-favorite', 'favorite', true, CriteriaComparison.Equals, AppAttributeIcons.FavoriteOn, 'Favorite', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-playCount', 'playCount', 0, CriteriaComparison.Equals, AppAttributeIcons.PlayCount, 'Not Played', result, existingCriteria.quickCriteria);
    const longPlaySongCount = this.options.getNumber(ModuleOptionId.LongPlayAlbumThreshold);
    this.addQuickFilterChip('quickFilter-songCount', 'songCount', longPlaySongCount, CriteriaComparison.GreaterThanOrEqualTo, AppAttributeIcons.LongPlay, 'Long Play', result, existingCriteria.quickCriteria);
    return result;
  }

  public getQuickFiltersForClassifications(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addQuickFilterChip('quickFilter-genre', 'classificationTypeId', ValueLists.Genre.id, CriteriaComparison.Equals, AppEntityIcons.Genre, 'Genres', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-subgenre', 'classificationTypeId', ValueLists.Subgenre.id, CriteriaComparison.Equals, AppEntityIcons.Subgenre, 'Subgenres', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-occasion', 'classificationTypeId', ValueLists.Occasion.id, CriteriaComparison.Equals, AppEntityIcons.Occasion, 'Occasions', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-instrument', 'classificationTypeId', ValueLists.Instrument.id, CriteriaComparison.Equals, AppEntityIcons.Instrument, 'Instruments', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-category', 'classificationTypeId', ValueLists.Category.id, CriteriaComparison.Equals, AppEntityIcons.Category, 'Categories', result, existingCriteria.quickCriteria);
    return result;
  }

  public getSortingPanelModel(chips: IChipItem[], subTitle: string, subTitleIcon: string): IChipSelectionModel {
    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Sort',
      titleIcon: 'mdi-sort mdi',
      subTitle: subTitle,
      subTitleIcon: subTitleIcon,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: chips,
      okHidden: true,
      okDelay: 300,
      onChipClick: (selectionChanged, chipItem, model) => {
        const criteriaItems = chipItem.value as CriteriaItems;
        // If the user clicked a new item, match the sort direction on all internal criteria items
        if (selectionChanged) {
          // All criteria items must use the same sort direction
          if (criteriaItems && criteriaItems.length) {
            // Use the first item to determine the general sort direction
            const firstItem = criteriaItems[0];
            // Don't set secondary icon for alternate sorting
            if (firstItem.sortDirection !== CriteriaSortDirection.Alternate) {
              // Remove all secondary icons
              model.items.forEach(i => i.secondaryIcon = null);
              // Set icon
              chipItem.secondaryIcon = firstItem.sortDirection === CriteriaSortDirection.Ascending ?
                AppActionIcons.SortAscending : AppActionIcons.SortDescending;
              // Make sure the sorting matches the icon          
              criteriaItems.forEach(i => i.sortDirection = firstItem.sortDirection);
            }
          }
          // The Ok action will be called automatically
        }
        // If the user clicked the same sort, swap the sorting direction
        else {
          if (criteriaItems && criteriaItems[0] && criteriaItems[0].sortDirection === CriteriaSortDirection.Alternate) {
            // Don't do anything if the user is clicking a selected alternate sorting
            return;
          }
          // A selected chip was clicked so swap the sort direction
          if (chipItem.secondaryIcon === AppActionIcons.SortAscending) {
            chipItem.secondaryIcon = AppActionIcons.SortDescending;
            criteriaItems.forEach(i => i.sortDirection = CriteriaSortDirection.Descending);
          }
          else {
            chipItem.secondaryIcon = AppActionIcons.SortAscending;
            criteriaItems.forEach(i => i.sortDirection = CriteriaSortDirection.Ascending);
          }
          // Fire only in this case since it will automatically close if the selection changed
          this.sidebarHostService.closeOk();
        }
      }
    };
    return result;
  }

  private addSortingChip(
    id: string,
    columns: string[],
    icon: string,
    caption: string,
    chips: IChipItem[],
    sortingCriteria: CriteriaItems,
    sortDirection?: CriteriaSortDirection
  ): IChipItem {
    const criteriaItems = new CriteriaItems();
    criteriaItems.id = id;
    for (const columnName of columns) {
      criteriaItems.addSorting(columnName, sortDirection ? sortDirection : CriteriaSortDirection.Ascending);
    }
    chips.push({
      sequence: chips.length + 1,
      icon: icon,
      caption: caption,
      value: criteriaItems,
      secondaryIcon: this.getSortingIcon(criteriaItems.id, sortingCriteria),
      selected: sortingCriteria.id === criteriaItems.id
    });
    return chips[chips.length - 1];
  }

  private addAlternateChip(
    id: string,
    columns: string[],
    icon: string,
    caption: string,
    chips: IChipItem[],
    sortingCriteria: CriteriaItems
  ): IChipItem {
    return this.addSortingChip(id, columns, icon, caption, chips, sortingCriteria, CriteriaSortDirection.Alternate);
  }

  public getSortingForSongs(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-artistName', ['primaryArtistName', 'primaryAlbumName', 'mediaNumber', 'trackNumber', 'name'],
      AppAttributeIcons.ArtistName, 'Artist Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-albumName', ['primaryAlbumName', 'mediaNumber', 'trackNumber', 'name'],
      AppAttributeIcons.AlbumName, 'Album Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-releaseYear',
      ['releaseYear', 'primaryAlbumName', 'mediaNumber', 'trackNumber', 'name'],
      AppAttributeIcons.Year, 'Release Year', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-playCount', ['playCount', 'releaseYear', 'name'],
      AppAttributeIcons.PlayCount, 'Play Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-playDate', ['playDate'],
      AppAttributeIcons.PlayDate, 'Play Date', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-addDate', ['addDate', 'name'],
      AppAttributeIcons.AddDate, 'Add Date', result, existingCriteria.sortingCriteria);
    this.addAlternateChip(
      'alternate-artist', ['primaryArtistName'],
      AppActionIcons.Alternate, 'Alternate Artists', result, existingCriteria.sortingCriteria);
    this.addAlternateChip(
      'alternate-language', ['language'],
      AppActionIcons.Alternate, 'Alternate Languages', result, existingCriteria.sortingCriteria);
    
    return result;
  }

  public getSortingForAlbumArtists(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-artistName', ['name'],
      AppAttributeIcons.ArtistName, 'Artist Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-playCount', ['playCount', 'name'],
      AppAttributeIcons.PlayCount, 'Play Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-songCount', ['songCount', 'name'],
      AppAttributeIcons.SongCount, 'Song Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-addDate', ['songAddDateMax'],
      AppAttributeIcons.AddDate, 'Last Song Add Date', result, existingCriteria.sortingCriteria);    
    return result;
  }

  public getSortingForAlbums(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-albumName', ['name'],
      AppAttributeIcons.AlbumName, 'Album Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-playCount', ['playCount', 'releaseYear', 'name'],
      AppAttributeIcons.PlayCount, 'Play Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-songCount', ['songCount', 'releaseYear', 'name'],
      AppAttributeIcons.SongCount, 'Song Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-addDate', ['songAddDateMax'],
      AppAttributeIcons.AddDate, 'Last Song Add Date', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-artistName', ['artistName', 'releaseYear', 'name'],
      AppAttributeIcons.ArtistName, 'Artist Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-releaseYear', ['releaseYear', 'name'],
      AppAttributeIcons.Year, 'Release Year', result, existingCriteria.sortingCriteria);    
    return result;
  }

  public getSortingForClassifications(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-classificationName', ['name'],
      AppEntityIcons.Classification, 'Classification Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-classificationType', ['classificationType', 'name'],
      AppAttributeIcons.ClassificationType, 'Classification Type', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-songCount', ['songCount', 'name'],
      AppAttributeIcons.SongCount, 'Song Count', result, existingCriteria.sortingCriteria);    
    return result;
  }

  public getSortingForPlaylists(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-playlistName', ['name'],
      AppEntityIcons.Playlist, 'Playlist Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-songCount', ['songCount', 'name'],
      AppAttributeIcons.SongCount, 'Song Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-changeDate', ['changeDate'],
      AppAttributeIcons.ChangeDate, 'Change Date', result, existingCriteria.sortingCriteria);    
    return result;
  }

  public getSortingForFilters(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-filterName', ['name'],
      AppEntityIcons.Smartlist, 'Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-favorite', ['favorite', 'accessDate', 'name'],
      AppAttributeIcons.FavoriteOn, 'Favorite', result, existingCriteria.sortingCriteria, CriteriaSortDirection.Descending);
    this.addSortingChip(
      'sorting-accessDate', ['accessDate'],
      AppAttributeIcons.AccessDate, 'Access Date', result, existingCriteria.sortingCriteria, CriteriaSortDirection.Descending);
    return result;
  }

  private getSortingIcon(id: string, criteriaItems: CriteriaItems): string {
    if (criteriaItems.id === id) {
      const firstItem = criteriaItems[0];
      if (firstItem.sortDirection === CriteriaSortDirection.Ascending) {
        return AppActionIcons.SortAscending;
      }
      return AppActionIcons.SortDescending;
    }
    return null;
  }

  public async getValueListSelectorModel(valueListTypeId: string, sortByName: boolean, isSelected: (chip: IChipItem) => boolean): Promise<IChipSelectionModel> {
    let entries = await ValueListEntryEntity.findBy({ valueListTypeId: valueListTypeId });
    if (sortByName) {
      entries = this.utilities.sort(entries, 'name');
    }
    else {
      entries = this.utilities.sort(entries, 'sequence');
    }

    const chips = entries.map(entry => {
      const chip: IChipItem = {
        value: entry.id,
        caption: entry.name
      };
      chip.selected = isSelected(chip);
      return chip;
    });

    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Filter By',
      titleIcon: AppActionIcons.Filter,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Multiple,
      items: chips
    };
    return result;
  }

  public async getSongValuesSelectorModel(columnName: string, isSelected: (chip: IChipItem) => boolean): Promise<IChipSelectionModel> {
    let values = await this.getSongValues(columnName);
    values.forEach(v => v.selected = isSelected(v));
    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Filter By',
      titleIcon: AppActionIcons.Filter,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Multiple,
      items: values
    };
    return result;
  }
}
