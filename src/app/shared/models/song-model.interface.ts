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
  fileExtension: string;
  // Song info
  cleanName: string;
  trackNumber: number;
  mediaNumber: number;
  releaseYear: number;
  releaseDecade: number;
  rating: number;
  playCount: number;
  performerCount: number;
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
  advisory: number;
  // Dates
  addDate: Date;
  changeDate: Date;
  playDate: Date;
  replaceDate: Date;

  // Join info
  primaryAlbumName: string;
  primaryAlbumStylized: string;
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
  originalSongId: string;
  // Song info
  titleSort: string;
  subtitle: string;
  mediaSubtitle: string;
  featuring: string;
  grouping: string;
  composer: string;
  composerSort: string;
  originalArtist: string;
  originalAlbum: string;
  originalReleaseYear: number;
  comment: string;
  infoUrl: string;
  videoUrl: string;
  // Audio info
  replayGain: number;
  tempo: number;
  // Dates
  addYear: number;
}

export interface ISongExtendedModel extends ISongFullModel {
  country: string;
  primaryAlbumDescription: string;
  primaryAlbumSort: string;
  primaryAlbumType: string;
  primaryAlbumPublisher: string;
  primaryArtistSort: string;
  primaryArtistType: string;
}