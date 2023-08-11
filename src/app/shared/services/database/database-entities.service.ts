import { Injectable } from '@angular/core';
import { AlbumEntity, ArtistEntity, PlayHistoryEntity, PlaylistEntity, PlaylistSongEntity, RelatedImageEntity, SongEntity } from '../../entities';
import { ISongModel } from '../../models/song-model.interface';
import { IsNull, Not } from 'typeorm';
import { ICriteriaValueSelector } from '../criteria/criteria.interface';
import { DbColumn, databaseColumns } from './database.columns';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from '../../components/chip-selection/chip-selection-model.interface';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { CriteriaComparison, CriteriaJoinOperator, CriteriaTransformAlgorithm } from '../criteria/criteria.enum';
import { DatabaseService } from './database.service';
import { Criteria, CriteriaItem } from '../criteria/criteria.class';
import { FilterCriteriaEntity } from '../../entities/filter-criteria.entity';
import { FilterCriteriaItemEntity } from '../../entities/filter-criteria-item.entity';
import { IFilterModel } from '../../models/filter-model.interface';
import { ChipSelectionComponent } from '../../components/chip-selection/chip-selection.component';
import { DatabaseOptionsService } from './database-options.service';
import { ModuleOptionName } from '../../models/module-option.enum';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseEntitiesService {

  constructor(
    private utilities: UtilityService,
    private db: DatabaseService,
    private options: DatabaseOptionsService,
    private sidebarService: SideBarStateService) { }

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

  public async setFavoriteSong(songId: string, favorite: boolean): Promise<boolean> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.favorite = favorite;
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

  /**
   * Gets a playlist with its associated song entities.
   * If the playlist doesn't have associated songs, it will return null.
   */
  public getPlaylistWithSongs(playlistId: string): Promise<PlaylistEntity> {
    return PlaylistEntity
      .getRepository()
      .createQueryBuilder('playlist')
      .innerJoinAndSelect('playlist.playlistSongs', 'playlistSong')
      .innerJoinAndSelect('playlistSong.song', 'song')
      .where('playlist.id = :playlistId')
      .setParameter('playlistId', playlistId)
      .getOne();
  }

  public getArtistDetails(artistId: string): Promise<any> {
    return ArtistEntity
      .getRepository()
      .createQueryBuilder('artist')
      .innerJoin('valueListEntry', 'artistTypeEntry', 'artist.artistTypeId = artistTypeEntry.id')
      .innerJoin('valueListEntry', 'countryEntry', 'artist.countryId = countryEntry.id')
      .addSelect('artistTypeEntry.name', 'artistType')
      .addSelect('countryEntry.name', 'country')
      .where('artist.id = :artistId')
      .setParameter('artistId', artistId)
      .getRawOne();
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

  public getTracks(playlistId: string): Promise<PlaylistSongEntity[]> {
    return PlaylistSongEntity
      .getRepository()
      .createQueryBuilder('playlistSong')
      .innerJoinAndSelect('playlistSong.song', 'song')
      .innerJoinAndSelect('song.primaryAlbum', 'album')
      .innerJoinAndSelect('album.primaryArtist', 'artist')
      .where('playlistSong.playlistId = :playlistId')
      .setParameter('playlistId', playlistId)
      .orderBy('playlistSong.sequence')
      .getMany();
  }

  public async export(): Promise<any> {
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
          { caption: 'Alternate Artist', value: CriteriaTransformAlgorithm.AlternateArtist },
          { caption: 'Alternate Language', value: CriteriaTransformAlgorithm.AlternateLanguage }
        ];
        break;
    }
    return result;
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
    for (const filterCriteriaItem of filterCriteriaItems) {
      const criteriaItem = new CriteriaItem(filterCriteriaItem.columnName);
      criteriaItem.id = filterCriteriaItem.id;
      if (filterCriteriaItem.columnValue) {
        criteriaItem.columnValues.push({ value: filterCriteriaItem.columnValue});
      }
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

  public getQuickFilterPanelModel(values: ISelectableValue[], subTitle: string, subTitleIcon: string): IChipSelectionModel {
    const multipleEnabled = this.options.getBoolean(ModuleOptionName.AllowMultipleQuickFilters);
    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Quick Filters',
      titleIcon: 'mdi-filter mdi',
      subTitle: subTitle,
      subTitleIcon: subTitleIcon,
      displayMode: ChipDisplayMode.Block,
      type: multipleEnabled ? ChipSelectorType.MultipleOk : ChipSelectorType.Quick,
      values: values,
      okHidden: !multipleEnabled,
      actions: [{
        caption: 'Clear',
        action: (iconAction, result) => {
          const model = result as IChipSelectionModel;
          model.values.forEach(v => v.selected = false);
          if (!multipleEnabled) {
            this.sidebarService.hideRight();
            if (model.onOk) {
              model.onOk(model);
            }
          }
        }
      }]
    };
    return result;
  }

  public getQuickFilterCriteriaForSongs(existingCriteria: Criteria): ISelectableValue[] {
    const result: ISelectableValue[] = [];

    let criteriaItem = new CriteriaItem('favorite', true);
    criteriaItem.id = 'quickFilter-favorite';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Favorite';
    criteriaItem.displayValue = 'Yes';
    result.push({
      sequence: 1,
      icon: 'mdi-heart mdi',
      caption: 'Favorite',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-favorite') });

    criteriaItem = new CriteriaItem('playCount', 0);
    criteriaItem.id = 'quickFilter-playCount';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Play Count';
    criteriaItem.displayValue = '0';
    result.push({
      sequence: 2,
      icon: 'mdi-play mdi',
      caption: 'Not Played',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-playCount') });

    criteriaItem = new CriteriaItem('lyrics');
    criteriaItem.id = 'quickFilter-lyrics';
    criteriaItem.comparison = CriteriaComparison.IsNotNull;
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Has Lyrics';
    criteriaItem.displayValue = 'Yes';
    result.push({
      sequence: 3,
      icon: 'mdi-script-text mdi',
      caption: 'Has Lyrics',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-lyrics') });

    criteriaItem = new CriteriaItem('rating', 5);
    criteriaItem.id = 'quickFilter-rating';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Rating';
    criteriaItem.displayValue = '5';
    result.push({
      sequence: 4,
      icon: 'mdi-star mdi',
      caption: 'Top Rated',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-rating') });

    criteriaItem = new CriteriaItem('live', true);
    criteriaItem.id = 'quickFilter-live';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Live';
    criteriaItem.displayValue = 'Yes';
    result.push({
      sequence: 5,
      icon: 'mdi-broadcast mdi',
      caption: 'Live',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-live') });

    criteriaItem = new CriteriaItem('explicit', true);
    criteriaItem.id = 'quickFilter-explicit';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Explicit';
    criteriaItem.displayValue = 'Yes';
    result.push({
      sequence: 6,
      icon: 'mdi-alpha-e-box-outline mdi',
      caption: 'Explicit',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-explicit') });

    criteriaItem = new CriteriaItem('performers', 1);
    criteriaItem.id = 'quickFilter-performers';
    criteriaItem.comparison = CriteriaComparison.GreaterThan;
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Performers';
    criteriaItem.displayValue = 'More Than 1';
    result.push({
      sequence: 7,
      icon: 'mdi-account-multiple mdi',
      caption: 'Multi Artist',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-performers') });

    return result;
  }

  public getQuickFilterCriteriaForArtists(existingCriteria: Criteria): ISelectableValue[] {
    const result: ISelectableValue[] = [];

    let criteriaItem = new CriteriaItem('favorite', true);
    criteriaItem.id = 'quickFilter-favorite';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Favorite';
    criteriaItem.displayValue = 'Yes';
    result.push({
      sequence: 1,
      icon: 'mdi-heart mdi',
      caption: 'Favorite',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-favorite') });

    criteriaItem = new CriteriaItem('playCount', 0);
    criteriaItem.id = 'quickFilter-playCount';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Play Count';
    criteriaItem.displayValue = '0';
    result.push({
      sequence: 2,
      icon: 'mdi-play mdi',
      caption: 'Not Played',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-playCount') });

    const longPlaySongCount = this.options.getNumber(ModuleOptionName.LongPlayArtistThreshold);
    criteriaItem = new CriteriaItem('songCount', longPlaySongCount);
    criteriaItem.id = 'quickFilter-songCount';
    criteriaItem.comparison = CriteriaComparison.GreaterThanOrEqualTo;
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Song Count';
    criteriaItem.displayValue = 'Greater than or equal to ' + longPlaySongCount;
    result.push({
      sequence: 3,
      icon: 'mdi-music-box-multiple-outline mdi',
      caption: 'Long Play',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-songCount') });

    return result;
  }

  public getQuickFilterCriteriaForAlbums(existingCriteria: Criteria): ISelectableValue[] {
    const result: ISelectableValue[] = [];

    let criteriaItem = new CriteriaItem('favorite', true);
    criteriaItem.id = 'quickFilter-favorite';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Favorite';
    criteriaItem.displayValue = 'Yes';
    result.push({
      sequence: 1,
      icon: 'mdi-heart mdi',
      caption: 'Favorite',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-favorite') });

    criteriaItem = new CriteriaItem('playCount', 0);
    criteriaItem.id = 'quickFilter-playCount';
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Play Count';
    criteriaItem.displayValue = '0';
    result.push({
      sequence: 2,
      icon: 'mdi-play mdi',
      caption: 'Not Played',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-playCount') });

    const longPlaySongCount = this.options.getNumber(ModuleOptionName.LongPlayAlbumThreshold);
    criteriaItem = new CriteriaItem('songCount', longPlaySongCount);
    criteriaItem.id = 'quickFilter-songCount';
    criteriaItem.comparison = CriteriaComparison.GreaterThanOrEqualTo;
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    criteriaItem.displayName = 'Song Count';
    criteriaItem.displayValue = 'Greater than or equal to ' + longPlaySongCount;
    result.push({
      sequence: 3,
      icon: 'mdi-music-box-multiple-outline mdi',
      caption: 'Long Play',
      value: criteriaItem,
      selected: !!existingCriteria.searchCriteria.find(c => c.id === 'quickFilter-songCount') });

    return result;
  }
}
