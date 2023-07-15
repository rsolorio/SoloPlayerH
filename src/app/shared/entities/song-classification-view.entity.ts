import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongBaseEntity } from './song-base.entity';

/**
 * This view combines the song entity with the songClassification entity.
 * Fields: id, name, hash, filePath, playCount, releaseYear, releaseDecade,
 * trackNumber, mediaNumber, seconds, favorite, live, explicit, performers, rating, mood, language,
 * lyrics, primaryAlbumName, primaryArtistName, primaryArtistStylized,
 * titleSort, primaryAlbumId, primaryArtistId, classificationId
 */
 @ViewEntity({
  name: 'songClassificationView',
  expression: `
  SELECT song.id, song.name, song.hash, song.filePath, song.fileSize,
  song.playCount, song.releaseYear, song.releaseDecade, song.genre, song.trackNumber, song.mediaNumber, song.titleSort,
  song.seconds, song.duration, song.bitrate, song.vbr, song.frequency,
  song.favorite, song.live, song.explicit, song.performers, song.rating, song.mood, song.language, song.lyrics, song.addDate, song.playDate,
  album.name AS primaryAlbumName, artist.name AS primaryArtistName, artist.artistStylized AS primaryArtistStylized, song.primaryAlbumId, album.primaryArtistId, songClassification.classificationId
  FROM song
  INNER JOIN album
  ON song.primaryAlbumId = album.id
  INNER JOIN artist
  ON album.primaryArtistId = artist.id
  INNER JOIN songClassification
  ON song.id = songClassification.songId
`
})
export class SongClassificationViewEntity extends SongBaseEntity implements ISongModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  @ViewColumn()
  filePath: string;
  @ViewColumn()
  fileSize: number;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  releaseYear: number;
  @ViewColumn()
  releaseDecade: number;
  @ViewColumn()
  genre: string;
  @ViewColumn()
  trackNumber: number;
  @ViewColumn()
  mediaNumber: number;
  @ViewColumn()
  titleSort: string;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  duration: string;
  @ViewColumn()
  bitrate: number;
  @ViewColumn()
  vbr: boolean;
  @ViewColumn()
  frequency: number;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  live: boolean;
  @ViewColumn()
  explicit: boolean;
  @ViewColumn()
  performers: number;
  @ViewColumn()
  rating: number;
  @ViewColumn()
  mood: string;
  @ViewColumn()
  language: string;
  @ViewColumn()
  lyrics: string;
  @ViewColumn()
  addDate: Date;
  @ViewColumn()
  playDate: Date;
  @ViewColumn()
  primaryAlbumName: string;
  @ViewColumn()
  primaryArtistName: string;
  @ViewColumn()
  primaryArtistStylized: string;
  @ViewColumn()
  primaryAlbumId: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  classificationId: string;
}
