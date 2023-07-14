import { IIcon } from 'src/app/core/models/core.interface';
import { IAlbumModel } from './album-model.interface';
import { IListItemModel } from './base-model.interface';
import { PlayerSongStatus } from './player.enum';

/**
 * This interface defines the fields needed for the views that return song records
 * like: songView, songClassificationView, songArtistView
 */
export interface ISongModel extends IListItemModel {
  filePath: string;
  fileSize: number;
  playCount: number;
  releaseYear: number;
  genre: string;
  favorite: boolean;
  live: boolean;
  explicit: boolean;
  bitrate: number;
  vbr: boolean;
  frequency: number;
  rating: number;
  mood: string;
  language: string;
  lyrics: string;
  addDate: Date;
  playDate: Date;
  releaseDecade: number;
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
  duration: string;
  primaryAlbum: IAlbumModel;
  playerStatus: PlayerSongStatus;
  primaryAlbumId: string;
  primaryArtistId: string;
  classificationId: string;
  recentPlayIcon?: IIcon;
}
