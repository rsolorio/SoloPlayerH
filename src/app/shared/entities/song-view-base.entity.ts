import { ViewColumn } from "typeorm";
import { ISongModel } from "../models/song-model.interface";
import { SongBaseEntity } from "./song-base.entity";

/**
 * Base class that includes all columns for any view implementing the ISongModel interface.
 */
export class SongViewBaseEntity extends SongBaseEntity implements ISongModel {
  // Base entity
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  // Ids
  @ViewColumn()
  primaryAlbumId: string;
  // File info
  @ViewColumn()
  filePath: string;
  @ViewColumn()
  fileSize: number;
  // Song info
  @ViewColumn()
  trackNumber: number;
  @ViewColumn()
  mediaNumber: number;
  @ViewColumn()
  releaseYear: number;
  @ViewColumn()
  releaseDecade: number;
  @ViewColumn()
  rating: number;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  performers: number;
  @ViewColumn()
  genre: string;
  @ViewColumn()
  mood: string;
  @ViewColumn()
  language: string;
  @ViewColumn()
  lyrics: string;
  // Audio info
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  duration: string;
  @ViewColumn()
  bitrate: number;
  @ViewColumn()
  frequency: number;
  @ViewColumn()
  vbr: boolean;
  // Flags
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  live: boolean;
  @ViewColumn()
  explicit: boolean;
  // Dates
  @ViewColumn()
  addDate: Date;
  @ViewColumn()
  playDate: Date;
  // Join info  
  @ViewColumn()
  primaryAlbumName: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  primaryArtistName: string;
  @ViewColumn()
  primaryArtistStylized: string;
  // Optional info
  artistId: string;
  classificationId: string;
  playlistId: string;
}