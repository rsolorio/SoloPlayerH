import { Injectable } from '@angular/core';
import { AlbumEntity, ArtistEntity, DataMappingEntity, DataSourceEntity, FilterEntity, PartyRelationEntity, PlayHistoryEntity, PlaylistEntity, PlaylistSongViewEntity, RelatedImageEntity, SongClassificationEntity, SongEntity, SongViewEntity, SyncProfileEntity, ValueListEntryEntity } from '../../entities';
import { ISongModel } from '../../models/song-model.interface';
import { In, IsNull, Not } from 'typeorm';
import { ICriteriaValueSelector } from '../criteria/criteria.interface';
import { DbColumn, databaseColumns } from './database.columns';
import { ChipSelectorType, IChipItem } from '../../components/chip-selection/chip-selection-model.interface';
import { IDateRange, ISelectableValue } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { CriteriaTransformAlgorithm } from '../criteria/criteria.enum';
import { DatabaseService } from './database.service';
import { Criteria, CriteriaItem } from '../criteria/criteria.class';
import { FilterCriteriaEntity } from '../../entities/filter-criteria.entity';
import { FilterCriteriaItemEntity } from '../../entities/filter-criteria-item.entity';
import { IFilterModel } from '../../models/filter-model.interface';
import { AppAttributeIcons } from 'src/app/app-icons';
import { ISyncProfile, ISyncProfileParsed, SyncType } from '../../models/sync-profile-model.interface';
import { IPlaylistSongModel } from '../../models/playlist-song-model.interface';
import { IDataSourceParsed } from 'src/app/mapping/data-source/data-source.interface';
import { PartyRelationType } from '../../models/music.enum';
import { FileService } from 'src/app/platform/file/file.service';
import { IAlbumModel } from '../../models/album-model.interface';
import { IArtistModel } from '../../models/artist-model.interface';
import { IPlaylistModel } from '../../models/playlist-model.interface';
import { IPopularity } from '../../models/music-model.interface';
import { RelativeDateOperator, RelativeDateTerm, RelativeDateUnit } from '../relative-date/relative-date.enum';
import { RelativeDateService } from '../relative-date/relative-date.service';
import { ValueLists } from './database.lists';
import { LastFmService } from '../last-fm/last-fm.service';
import { EntityId } from './database.seed';
import { ILastFmScrobbleRequest } from '../last-fm/last-fm.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { LogLevel } from 'src/app/core/services/log/log.enum';

@Injectable({
  providedIn: 'root'
})
export class DatabaseEntitiesService {

  constructor(
    private utilities: UtilityService,
    private db: DatabaseService,
    private fileService: FileService,
    private relativeDates: RelativeDateService,
    private lastFm: LastFmService,
    private log: LogService) { }

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

  /**
   * Gets all featuring artists associated with the specified song.
   * @param songId The id of the song.
   * @returns Artist stylized names separated by comma.
   */
  public async getSongContributors(songId: string): Promise<string> {
    const relations = await PartyRelationEntity.findBy({ songId: songId, relationTypeId: PartyRelationType.Featuring });
    if (relations.length) {
      const artists = await ArtistEntity.findBy({ id: In(relations.map(r => r.relatedId ))});
      if (artists.length) {
        return artists.map(a => a.artistStylized).join(', ');
      }
    }
    return null;
  }

  /**
   * Adds a play history record and updates the song entity if needed.
   * This method does nothing in debug mode.
   * @param songId The id of the song.
   * @param count The number of plays for that song. It is usually set to 1, and the number is added to the total play count.
   * If set to 0, the method will do nothing and return null.
   * @param progress The % play progress when it was recorded.
   * @returns A song entity if it was updated.
   */
  public async registerPlayHistory(songId: string, count: number, progress: number): Promise<SongEntity> {
    // This particular functionality will be disabled when debug (verbose) is on.
    if (this.log.level === LogLevel.Verbose) {
      return null;
    }
    // Add play record
    const playRecord = new PlayHistoryEntity();
    playRecord.songId = songId;
    playRecord.playDate = new Date();
    playRecord.playCount = count;
    playRecord.progress = progress;
    if (count) {
      playRecord.scrobbled = await this.scrobble(songId);
    }
    else {
      playRecord.scrobbled = false;
    }
    
    await playRecord.save();
    // Increase play count
    if (!count) {
      return null;
    }

    const song = await SongEntity.findOneBy({ id: songId });
    song.playCount = song.playCount + count;
    song.playDate = playRecord.playDate;
    song.changeDate = playRecord.playDate;
    await song.save();
    return song;
  }

  /**
   * Creates an object with proper album, artist and track information.
   */
  public async prepareScrobbleRequest(songId: string): Promise<ILastFmScrobbleRequest> {
    const song = await SongViewEntity.findOneBy({ id: songId });
    const contributors = await this.getSongContributors(songId);
    if (!song) {
      this.log.warn(`Song id ${songId} not found.`);
    }
    let artistName = song.primaryArtistStylized;
    if (contributors) {
      if (song.primaryArtistId === EntityId.ArtistVarious) {
        // Ensure "Various" doesn't end up as Artist if there are actual artists
        artistName = contributors;
      }
      else {
        // Album artist and contributors should be part of the Artist
        artistName += ', ' + contributors;
      }
    }
    return {
      albumArtistName: song.primaryArtistId === EntityId.ArtistVarious ? song.primaryArtistName : song.primaryArtistStylized,
      artistName: artistName,
      trackTitle: song.cleanName,
      albumName: song.primaryAlbumStylized
    };
  }

  public async scrobble(songId: string): Promise<boolean> {
    const scrobbleRequest = await this.prepareScrobbleRequest(songId);
    try {
      const result = await this.lastFm.scrobble(scrobbleRequest);
    }
    catch (error) {
      this.log.warn('Error scrobbling.', error);
    }
    return true;
  }

  public async setFavoriteSong(songId: string, favorite: boolean): Promise<ISongModel> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.favorite = favorite;
    song.changeDate = new Date();
    await song.save();
    return song;
  }

  public async setFavoriteAlbum(albumId: string, favorite: boolean): Promise<IAlbumModel> {
    const album = await AlbumEntity.findOneBy({ id: albumId });
    album.favorite = favorite;
    await album.save();
    return album;
  }

  public async setFavoriteArtist(artistId: string, favorite: boolean): Promise<IArtistModel> {
    const artist = await ArtistEntity.findOneBy({ id: artistId });
    artist.favorite = favorite;
    await artist.save();
    return artist;
  }

  public async setFavoritePlaylist(playlistId: string, favorite: boolean): Promise<IPlaylistModel> {
    const playlist = await PlaylistEntity.findOneBy({ id: playlistId });
    playlist.favorite = favorite;
    await playlist.save();
    return playlist;
  }

  public async setFavoriteFilter(filterId: string, favorite: boolean): Promise<IFilterModel> {
    const filter = await FilterEntity.findOneBy({ id: filterId });
    filter.favorite = favorite;
    await filter.save();
    return filter;
  }

  public async setRating(songId: string, rating: number): Promise<void> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.rating = rating;
    song.changeDate = new Date();
    await song.save();
  }

  /**
   * Sets the live flag in the song entity and also creates or deletes
   * a song classification record associated with the song.
   */
  public async setLive(songId: string, live: boolean): Promise<SongEntity> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.live = live;
    song.changeDate = new Date();
    await song.save();
    await this.setLiveSubgenre(songId, live);
    return song;
  }

  public async setLiveSubgenre(songId: string, live: boolean): Promise<void> {
    // Create the classification
    if (live) {
      // Ensure it does not exist
      let songClass = await SongClassificationEntity.findOneBy({
        songId: songId,
        classificationId: ValueLists.Subgenre.entries.Live.id });
      if (!songClass) {
        songClass = new SongClassificationEntity();
        songClass.songId = songId;
        songClass.classificationId = ValueLists.Subgenre.entries.Live.id;
        songClass.classificationTypeId = ValueLists.Subgenre.id;
        songClass.primary = false;
        await songClass.save();
      }
      return;
    }
    // Remove classification
    await SongClassificationEntity.delete({ songId: songId, classificationId: ValueLists.Subgenre.entries.Live.id });
  }

  public async setExplicit(songId: string, explicit: boolean): Promise<SongEntity> {
    const song = await SongEntity.findOneBy({ id: songId });
    song.advisory = explicit ? 1 : 0;
    song.changeDate = new Date();
    await song.save();
    await this.setExplicitSubgenre(songId, explicit);
    return song;
  }

  public async setExplicitSubgenre(songId: string, explicit: boolean): Promise<void> {
    // Create the classification
    if (explicit) {
      // Ensure it does not exist
      let songClass = await SongClassificationEntity.findOneBy({
        songId: songId,
        classificationId: ValueLists.Subgenre.entries.Explicit.id });
      if (!songClass) {
        songClass = new SongClassificationEntity();
        songClass.songId = songId;
        songClass.classificationId = ValueLists.Subgenre.entries.Explicit.id;
        songClass.classificationTypeId = ValueLists.Subgenre.id;
        songClass.primary = false;
        await songClass.save();
      }
      return;
    }
    // Remove classification
    await SongClassificationEntity.delete({ songId: songId, classificationId: ValueLists.Subgenre.entries.Explicit.id });
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
      SELECT partyRelation.artistId, partyRelation.songId, artist.name AS artistName, artist.artistStylized
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
    const results = await this.db.runExpressionQuery({ entity: SongEntity, criteria: criteria, columnExpressions: [{ expression: columnName }] })
    
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

  public async saveSyncProfile(data: ISyncProfileParsed): Promise<ISyncProfile> {
    const syncProfile = await SyncProfileEntity.findOneBy({ id: data.id });
    syncProfile.directories = data.directoryArray ? JSON.stringify(data.directoryArray) : null;
    syncProfile.config = data.configObj ? JSON.stringify(data.configObj) : null;
    syncProfile.syncInfo = data.syncInfoObj ? JSON.stringify(data.syncInfoObj) : null;
    syncProfile.syncDate = data.syncDate;
    await syncProfile.save();
    return syncProfile;
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
          attributeArray: sourceRow.attributes ? sourceRow.attributes.split(',') : null,
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

  public async getSongPopularityByRange(range: IDateRange, limit: number): Promise<IPopularity[]> {
    const query = `
      SELECT songId AS id, MAX(playDate) AS maxPlayDate, SUM(playCount) AS sumPlayCount
      FROM playHistory
      WHERE playDate >= ? AND playDate <= ?
      GROUP BY songId
      ORDER BY sumPlayCount DESC, maxPlayDate DESC
      LIMIT ${limit}
    `;
    return await this.db.run(query, [
      this.utilities.toDateTimeSqlite(range.from),
      this.utilities.toDateTimeSqlite(range.to)
    ]);
  }

  /**
   * Gets the popularity of each song included in the specified date range.
   * The popularity is retrieved from the play history, grouping data by song, and getting the latest play date and the play count.
   * The range is set from the specified date to the current day.
   * @param unit the relative date unit of the range: d, m, y
   * @param value the number of units for the range
   * @param limit Max number of results (songs)
   * @returns 
   */
  public async getSongPopularityByUnit(unit: RelativeDateUnit, value: number, limit: number): Promise<IPopularity[]> {
    const exp = this.relativeDates.createExpression(`${RelativeDateTerm.ThisDay} ${RelativeDateOperator.Minus} ${value}${unit}`);
    if (this.relativeDates.isValid(exp)) {
      const range = this.relativeDates.parse(exp);
      // The "from" value of the range is the one that we need
      // And we are going to change the "to" value to today
      range.to = new Date();
      return await this.getSongPopularityByRange(range, limit);
    }
    return [];
  }

  public async findSimilarSongs(songId: string): Promise<SongEntity[]> {
    // Rules
    // Similarty should be: genre, decade, mood
    // Extra flag to take Langage into consideration
    // Do not take other classifications as there's not enough variety
    // A different method for taking rating and play count
    const song = await SongEntity.findOneBy({ id: songId });
    const songs = await SongEntity.findBy({ genre: song.genre, releaseDecade: song.releaseDecade, mood: song.mood });
    return songs;
  }
}
