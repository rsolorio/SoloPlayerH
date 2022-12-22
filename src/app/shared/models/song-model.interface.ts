import { IAlbumModel } from './album-model.interface';
import { IListItemModel } from './base-model.interface';
import { PlayerSongStatus } from './player.enum';

export interface ISongModel extends IListItemModel {
  filePath: string;
  playCount: number;
  releaseYear: number;
  favorite: boolean;
  /** This is a dynamic field that gets its value from either primaryAlbum object or primaryAlbumName property. */
  albumName: string;
  /** This is the value that comes from the album table. */
  primaryAlbumName: string;
  /** This is a dynamic field that gets its value from either primaryArtist object or primaryArtistName property. */
  artistName: string;
  /** This is the value that comes from the artist table. */
  primaryArtistName: string;
  /** This is a dynamic field that gets its value from either primaryArtist object or primaryArtistStylized property. */
  artistStylized: string;
  /** This is the value that comes from the artist table. */
  primaryArtistStylized: string;
  titleSort: string;
  trackNumber: number;
  mediaNumber: number;
  albumWithYear: string;
  playCountText: string;
  seconds: number;
  primaryAlbum: IAlbumModel;
  playerStatus: PlayerSongStatus;
  primaryAlbumId: string;
  primaryArtistId: string;
  classificationId: string;
}
