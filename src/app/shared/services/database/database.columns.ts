import { CriteriaDataType } from "../criteria/criteria.enum";
import { IColumn } from "../criteria/criteria.interface";

export enum DbColumn {
  Artist = 'artistId',
  AlbumArtist = 'primaryArtistId',
  AlbumArtistName = 'primaryArtistName',
  Album = 'primaryAlbumId',
  AlbumName = 'primaryAlbumName',
  Title = 'name',
  TitleSort = 'titleSort',
  TrackNumber = 'trackNumber',
  MediaNumber = 'mediaNumber',
  Classification = 'classificationId',
  Rating = 'rating',
  Mood = 'mood',
  PlayCount = 'playCount',
  Seconds = 'seconds',
  Language = 'language',
  Favorite = 'favorite',
  Live = 'live',
  Explicit = 'explicit',
  ReleaseYear = 'releaseYear',
  ReleaseDecade = 'releaseDecade',
  Lyrics = 'lyrics',
  AddDate = 'addDate',
  /** Fake column for sorting purposes. */
  SortBy = 'sortBy',
  /** Fake column for specifying the maximum number of results to return. */
  Limit = 'limit',
  /** Fake column for advanced sorting purposes. */
  TransformAlgorithm = 'transformAlgorithm',
}

export const databaseColumns: { [name: string]: IColumn } = { };
databaseColumns[DbColumn.Artist] = { name: DbColumn.Artist, caption: 'Artist', icon: 'mdi-account-music mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AlbumArtist] = { name: DbColumn.AlbumArtist, caption: 'Album Artist', icon: 'mdi-account-badge mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AlbumArtistName] = { name: DbColumn.AlbumArtistName, caption: 'Album Artist', icon: 'mdi-account-badge mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Album] = { name: DbColumn.Album, caption: 'Album', icon: 'mdi-album mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AlbumName] = { name: DbColumn.AlbumName, caption: 'Album', icon: 'mdi-album mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Title] = { name: DbColumn.Title, caption: 'Title', icon: 'mdi-music mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.TitleSort] = { name: DbColumn.TitleSort, caption: 'Title Sort', icon: 'mdi-sort-alphabetical-variant mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.TrackNumber] = { name: DbColumn.TrackNumber, caption: 'Track Number', icon: 'mdi-pound mdi', dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.MediaNumber] = { name: DbColumn.MediaNumber, caption: 'Media Number', icon: 'mdi-disc mdi', dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.Classification] = { name: DbColumn.Classification, caption: 'Classification', icon: 'mdi-tag-multiple-outline mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Rating] = { name: DbColumn.Rating, caption: 'Rating', icon: 'mdi-star-outline mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Mood] = { name: DbColumn.Mood, caption: 'Mood', icon: 'mdi-emoticon-happy-outline mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.PlayCount] = { name: DbColumn.PlayCount, caption: 'Play Count', icon: 'mdi-animation-play-outline mdi', dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.Seconds] = { name: DbColumn.Seconds, caption: 'Duration', icon: 'mdi-timer-outline mdi', dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.Language] = { name: DbColumn.Language, caption: 'Language', icon: 'mdi-translate mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Live] = { name: DbColumn.Live, caption: 'Live', icon: 'mdi-broadcast mdi', dataType: CriteriaDataType.Boolean };
databaseColumns[DbColumn.Favorite] = { name: DbColumn.Favorite, caption: 'Favorite', icon: 'mdi-heart-outline mdi', dataType: CriteriaDataType.Boolean };
databaseColumns[DbColumn.Explicit] = { name: DbColumn.Explicit, caption: 'Explicit', icon: 'mdi-message-alert-outline mdi', dataType: CriteriaDataType.Boolean };
databaseColumns[DbColumn.ReleaseYear] = { name: DbColumn.ReleaseYear, caption: 'Year', icon: 'mdi-calendar-blank-outline mdi', dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.ReleaseDecade] = { name: DbColumn.ReleaseDecade, caption: 'Decade', icon: 'mdi-calendar-blank-outline mdi', dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.Lyrics] = { name: DbColumn.Lyrics, caption: 'Lyrics', icon: 'mdi-script-text-outline mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AddDate] = { name: DbColumn.AddDate, caption: 'Add Date', icon: 'mdi-calendar-plus mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.SortBy] = { name: DbColumn.SortBy, caption: 'Sort By', icon: 'mdi-sort mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Limit] = { name: DbColumn.Limit, caption: 'Limit', icon: 'mdi-database-arrow-up mdi', dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.TransformAlgorithm] = { name: DbColumn.TransformAlgorithm, caption: 'Transform', icon: 'mdi-sort-alphabetical-variant mdi', dataType: CriteriaDataType.String };
