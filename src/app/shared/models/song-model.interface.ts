import { IIcon } from 'src/app/core/models/core.interface';
import { IListItemModel } from './base-model.interface';
import { PlayerSongStatus } from './player.enum';

/**
 * This interface contains the fields used by the views that return song records.
 * It does not contain all the song fields.
 */
export interface ISongModel extends IListItemModel {
  // Ids
  primaryAlbumId: string;
  // File info
  filePath: string;
  fileSize: number;
  // Song info
  trackNumber: number;
  mediaNumber: number;
  releaseYear: number;
  releaseDecade: number;
  rating: number;
  playCount: number;
  performers: number;
  genre: string;
  mood: string;
  language: string;
  lyrics: string;
  // Audio info
  seconds: number;
  duration: string;
  bitrate: number;
  frequency: number;
  vbr: boolean;
  // Flags
  favorite: boolean;
  live: boolean;
  explicit: boolean;
  // Dates
  addDate: Date;
  playDate: Date;

  // Join info
  primaryAlbumName: string;
  primaryArtistId: string;
  primaryArtistName: string;
  primaryArtistStylized: string;
  // Optional info
  artistId?: string;
  classificationId?: string;
  playlistId?: string;

  // Data not saved
  playerStatus: PlayerSongStatus;
  recentPlayIcon?: IIcon;
}

/**
 * This interface defines all the fields of the Song table.
 */
export interface ISongFullModel extends ISongModel {
  // Ids
  externalId: string;
  // Song info
  titleSort: string;
  initialPlayCount: number;
  grouping: string;
  composer: string;
  comment: string;
  infoUrl: string;
  videoUrl: string;
  // Audio info
  replayGain: number;
  tempo: number;
  fullyParsed: boolean;
  // Dates
  changeDate: Date;
  replaceDate: Date;
}
