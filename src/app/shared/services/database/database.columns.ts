import { CriteriaDataType } from "../criteria/criteria.enum";
import { ICriteriaColumn } from "../criteria/criteria.interface";

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
  Lyrics = 'lyrics'
}

export const databaseColumns: { [name: string]: ICriteriaColumn } = { };
databaseColumns[DbColumn.Artist] = { name: DbColumn.Artist, caption: 'Artist', icon: 'mdi-account-music mdi', dataType: CriteriaDataType.String };
databaseColumns[DbColumn.AlbumArtist] = { name: DbColumn.AlbumArtist, caption: 'Album Artist', icon: 'mdi-account-badge mdi', dataType: CriteriaDataType.String};
databaseColumns[DbColumn.Album] = { name: DbColumn.Album, caption: 'Album', icon: 'mdi-album mdi', dataType: CriteriaDataType.String};
databaseColumns[DbColumn.Classification] = { name: DbColumn.Classification, caption: 'Classification', icon: 'mdi-tag-multiple-outline mdi', dataType: CriteriaDataType.String};
databaseColumns[DbColumn.Rating] = { name: DbColumn.Rating, caption: 'Rating', icon: 'mdi-star-outline mdi', dataType: CriteriaDataType.String};
databaseColumns[DbColumn.Mood] = { name: DbColumn.Mood, caption: 'Mood', icon: 'mdi-emoticon-happy-outline mdi', dataType: CriteriaDataType.String};
databaseColumns[DbColumn.Language] = { name: DbColumn.Language, caption: 'Language', icon: 'mdi-translate mdi', dataType: CriteriaDataType.String};
databaseColumns[DbColumn.Favorite] = { name: DbColumn.Favorite, caption: 'Favorite', icon: 'mdi-heart-outline mdi', dataType: CriteriaDataType.Boolean};
databaseColumns[DbColumn.ReleaseDecade] = { name: DbColumn.ReleaseDecade, caption: 'Release Decade', icon: 'mdi-calendar-blank-outline mdi', dataType: CriteriaDataType.Number};
databaseColumns[DbColumn.Lyrics] = { name: DbColumn.Lyrics, caption: 'Lyrics', icon: 'mdi-script-text-outline mdi', dataType: CriteriaDataType.String};
