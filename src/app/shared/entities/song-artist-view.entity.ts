import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongBaseEntity } from './song-base.entity';

/**
 * This view combines the song entity with the songArtist entity.
 * It can be used to determine which artists are related with a particular song filtering by id (songId).
 * It can be used to get all the songs associated with one artist filtering by artistId.
 * However, it cannot be used with multiple artists since it will not return unique song rows
 * since the artistId column is part of the query and it causes the song rows to be duplicated;
 * for instance, if two artists are associated with one song, you will get two song rows.
 * Fields: id, name, filePath, playCount, releaseYear, trackNumber, mediaNumber, seconds, favorite,
 * rating, mood, language, lyrics, primaryAlbumName, primaryArtistName, primaryArtistStylized,
 * titleSort, primaryAlbumId, primaryArtistId, artistId
 * TODO: use standard typeorm syntax to create query, example: PlaylistSongViewEntity
 */
 @ViewEntity({
  name: 'songArtistView',
  expression: `
  SELECT song.id, song.name, song.filePath, song.fileSize, song.playCount, song.releaseYear, song.releaseDecade, song.genre, song.trackNumber, song.mediaNumber, song.seconds, song.bitrate, song.vbr, song.frequency, song.favorite, song.live, song.rating, song.mood, song.language, song.lyrics,
  album.name AS primaryAlbumName, artist.name AS primaryArtistName, artist.artistStylized AS primaryArtistStylized, song.titleSort, song.primaryAlbumId, album.primaryArtistId, songArtist.artistId
  FROM song
  INNER JOIN album
  ON song.primaryAlbumId = album.id
  INNER JOIN artist
  ON album.primaryArtistId = artist.id
  INNER JOIN songArtist
  ON song.id = songArtist.songId
`
})
export class SongArtistViewEntity extends SongBaseEntity implements ISongModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
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
  primaryAlbumName: string;
  @ViewColumn()
  primaryArtistName: string;
  @ViewColumn()
  primaryArtistStylized: string;
  @ViewColumn()
  titleSort: string;
  @ViewColumn()
  seconds: number;
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
  rating: number;
  @ViewColumn()
  mood: string;
  @ViewColumn()
  language: string;
  @ViewColumn()
  lyrics: string;
  @ViewColumn()
  primaryAlbumId: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  artistId: string;

  // Empty properties from ISongModel interface
  classificationId: string;
}
