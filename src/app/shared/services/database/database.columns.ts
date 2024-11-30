import { AppActionIcons, AppAttributeIcons, AppEntityIcons } from "src/app/app-icons";
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
  Advisory = 'advisory',
  PerformerCount = 'performerCount',
  ReleaseYear = 'releaseYear',
  ReleaseDecade = 'releaseDecade',
  Grouping = 'grouping',
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
databaseColumns[DbColumn.Artist] = { name: DbColumn.Artist, caption: 'Artist', icon: AppEntityIcons.Artist, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AlbumArtist] = { name: DbColumn.AlbumArtist, caption: 'Album Artist', icon: AppEntityIcons.AlbumArtist, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AlbumArtistName] = { name: DbColumn.AlbumArtistName, caption: 'Album Artist', icon: AppAttributeIcons.ArtistName, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Album] = { name: DbColumn.Album, caption: 'Album', icon: AppEntityIcons.Album, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AlbumName] = { name: DbColumn.AlbumName, caption: 'Album', icon: AppAttributeIcons.AlbumName, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Title] = { name: DbColumn.Title, caption: 'Title', icon: AppAttributeIcons.SongName, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.TitleSort] = { name: DbColumn.TitleSort, caption: 'Title Sort', icon: AppAttributeIcons.TitleSort, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.TrackNumber] = { name: DbColumn.TrackNumber, caption: 'Track Number', icon: AppAttributeIcons.TrackNumber, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.MediaNumber] = { name: DbColumn.MediaNumber, caption: 'Media Number', icon: AppAttributeIcons.MediaNumber, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.Grouping] = { name: DbColumn.Grouping, caption: 'Grouping', icon: AppAttributeIcons.Grouping, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Classification] = { name: DbColumn.Classification, caption: 'Classification', icon: AppEntityIcons.Classification, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Rating] = { name: DbColumn.Rating, caption: 'Rating', icon: AppAttributeIcons.RatingOn, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Mood] = { name: DbColumn.Mood, caption: 'Mood', icon: AppAttributeIcons.MoodOn, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.PlayCount] = { name: DbColumn.PlayCount, caption: 'Play Count', icon: AppAttributeIcons.PlayCount, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.Seconds] = { name: DbColumn.Seconds, caption: 'Duration', icon: AppAttributeIcons.Duration, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.Language] = { name: DbColumn.Language, caption: 'Language', icon: AppAttributeIcons.Language, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Live] = { name: DbColumn.Live, caption: 'Live', icon: AppAttributeIcons.LiveOn, dataType: CriteriaDataType.Boolean };
databaseColumns[DbColumn.Favorite] = { name: DbColumn.Favorite, caption: 'Favorite', icon: AppAttributeIcons.FavoriteOn, dataType: CriteriaDataType.Boolean };
databaseColumns[DbColumn.Advisory] = { name: DbColumn.Advisory, caption: 'Advisory', icon: AppAttributeIcons.Advisory, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.PerformerCount] = { name: DbColumn.PerformerCount, caption: 'Performers', icon: AppAttributeIcons.PerformerCount, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.ReleaseYear] = { name: DbColumn.ReleaseYear, caption: 'Year', icon: AppAttributeIcons.Year, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.ReleaseDecade] = { name: DbColumn.ReleaseDecade, caption: 'Decade', icon: AppAttributeIcons.Decade, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.Lyrics] = { name: DbColumn.Lyrics, caption: 'Lyrics', icon: AppAttributeIcons.LyricsOn, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AddDate] = { name: DbColumn.AddDate, caption: 'Add Date', icon: AppAttributeIcons.AddDate, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.SortBy] = { name: DbColumn.SortBy, caption: 'Sort By', icon: AppActionIcons.Sort, dataType: CriteriaDataType.String };
databaseColumns[DbColumn.Limit] = { name: DbColumn.Limit, caption: 'Limit', icon: AppAttributeIcons.Limit, dataType: CriteriaDataType.Number };
databaseColumns[DbColumn.TransformAlgorithm] = { name: DbColumn.TransformAlgorithm, caption: 'Transform', icon: 'mdi-sort-alphabetical-variant mdi', dataType: CriteriaDataType.String };
