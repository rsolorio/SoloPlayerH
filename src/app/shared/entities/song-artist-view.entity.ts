import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';

/**
 * This view combines the song entity with the songArtist entity.
 * It is intended to be used by filtering using the artistId column;
 * Fields: id, 
 */
 @ViewEntity({
  expression: `
  SELECT song.id, song.name, song.filePath, song.playCount, song.releaseYear, song.trackNumber, song.mediaNumber, album.name AS albumName,
  artist.name AS artistName, song.titleSort, song.primaryAlbumId, album.primaryArtistId, songArtist.artistId
  FROM song
  INNER JOIN album
  ON song.primaryAlbumId = album.id
  INNER JOIN artist
  ON album.primaryArtistId = artist.id
  INNER JOIN songArtist
  ON song.id = songArtist.songId
`
})
export class SongArtistViewEntity implements ISongModel {
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
  albumName: string;
  @ViewColumn()
  artistName: string;
  @ViewColumn()
  titleSort: string;
  @ViewColumn()
  primaryAlbumId: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  artistId: string;

  favorite: boolean;
  imageSrc: string;
  canBeRendered: boolean;
}
