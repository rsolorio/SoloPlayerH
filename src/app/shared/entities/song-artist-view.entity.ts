import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongBaseEntity } from './song-base.entity';

/**
 * This view combines the song entity with the songArtist entity.
 * It is intended to be used by filtering using the artistId column;
 * Fields: id, name, filePath, playCount, releaseYear, trackNumber, mediaNumber, seconds, favorite, albumName, artistName, titleSort, primaryAlbumId, primaryArtistId, artistId
 * TODO: use standard typeorm syntax to create query, example: PlaylistSongViewEntity
 */
 @ViewEntity({
  expression: `
  SELECT song.id, song.name, song.filePath, song.playCount, song.releaseYear, song.trackNumber, song.mediaNumber, song.seconds, song.favorite,
  album.name AS primaryAlbumName, artist.name AS primaryArtistName, song.titleSort, song.primaryAlbumId, album.primaryArtistId, songArtist.artistId
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
  playCount: number;
  @ViewColumn()
  releaseYear: number;
  @ViewColumn()
  trackNumber: number;
  @ViewColumn()
  mediaNumber: number;
  @ViewColumn()
  primaryAlbumName: string;
  @ViewColumn()
  primaryArtistName: string;
  @ViewColumn()
  titleSort: string;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  primaryAlbumId: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  artistId: string;
}
