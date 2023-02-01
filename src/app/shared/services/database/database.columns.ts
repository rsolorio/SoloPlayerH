import { ISelectedDataItem } from "src/app/core/models/core.interface";

export interface IColumnMetadata {
  name: string;
  caption: string;
  icon?: string;
}

export interface IColumnValueSelection {
  columnName: string;
  values: ISelectedDataItem<string>[];
}

export enum DbColumn {
  Artist = 'artistId',
  AlbumArtist = 'primaryArtistId',
  Album = 'primaryAlbumId',
  Classification = 'classificationId',
  Rating = 'rating',
  Mood = 'mood',
  Language = 'language',
  Favorite = 'favorite',
  ReleaseDecade = 'releaseDecade',
  Lyrics = 'Lyrics'
}

export const databaseColumns: { [name: string]: IColumnMetadata } = { };
databaseColumns[DbColumn.Artist] = { name: DbColumn.Artist, caption: 'Artist', icon: 'mdi-account-music mdi'};
databaseColumns[DbColumn.AlbumArtist] = { name: DbColumn.AlbumArtist, caption: 'Album Artist', icon: 'mdi-account-badge mdi'};
databaseColumns[DbColumn.Album] = { name: DbColumn.Album, caption: 'Album', icon: 'mdi-album mdi'};
databaseColumns[DbColumn.Classification] = { name: DbColumn.Classification, caption: 'Classification', icon: 'mdi-tag-multiple-outline mdi'};
databaseColumns[DbColumn.Rating] = { name: DbColumn.Rating, caption: 'Rating', icon: 'mdi-star-outline mdi'};
databaseColumns[DbColumn.Mood] = { name: DbColumn.Mood, caption: 'Mood', icon: 'mdi-emoticon-happy-outline mdi'};
databaseColumns[DbColumn.Language] = { name: DbColumn.Language, caption: 'Language', icon: 'mdi-translate mdi'};
databaseColumns[DbColumn.Favorite] = { name: DbColumn.Favorite, caption: 'Favorite', icon: 'mdi-heart-outline mdi'};
databaseColumns[DbColumn.ReleaseDecade] = { name: DbColumn.ReleaseDecade, caption: 'Release Decade', icon: 'mdi-calendar-blank-outline mdi'};
databaseColumns[DbColumn.Lyrics] = { name: DbColumn.Lyrics, caption: 'Lyrics', icon: 'mdi-script-text-outline mdi'};