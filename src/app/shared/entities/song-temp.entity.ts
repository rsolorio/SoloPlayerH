import { Column, Entity } from "typeorm";
import { SongBaseEntity } from "./song-base.entity";
import { ISongModel } from "../models/song-model.interface";

/**
 * This entity stores a list of songs that come from the result of a song view.
 * It is used to get a subset of song records and be able to apply isolated criteria.
 * This will be used by the export mechanism where the user will have the ability
 * to export a subset of songs based on a given criteria
 * and then apply filters to the subset based on another given criteria.
 */
@Entity({name: 'songTemp'})
export class SongTempEntity extends SongBaseEntity implements ISongModel {
  // Base entity
  @Column()
  id: string;
  @Column()
  name: string;
  @Column()
  hash: string;
  // Ids
  @Column()
  primaryAlbumId: string;
  // File info
  @Column()
  filePath: string;
  @Column()
  fileSize: number;
  // Song info
  @Column()
  trackNumber: number;
  @Column()
  mediaNumber: number;
  @Column()
  releaseYear: number;
  @Column()
  releaseDecade: number;
  @Column()
  rating: number;
  @Column()
  playCount: number;
  @Column()
  performers: number;
  @Column()
  genre: string;
  @Column()
  mood: string;
  @Column()
  language: string;
  @Column({ nullable: true })
  lyrics: string;
  // Audio info
  @Column()
  seconds: number;
  @Column()
  duration: string;
  @Column()
  bitrate: number;
  @Column()
  frequency: number;
  @Column()
  vbr: boolean;
  // Flags
  @Column()
  favorite: boolean;
  @Column()
  live: boolean;
  @Column()
  explicit: boolean;
  // Dates
  @Column()
  addDate: Date;
  @Column({ nullable: true })
  playDate: Date;
  // Join info  
  @Column()
  primaryAlbumName: string;
  @Column()
  primaryArtistId: string;
  @Column()
  primaryArtistName: string;
  @Column()
  primaryArtistStylized: string;
  // Optional info
  @Column({ nullable: true })
  artistId: string;
  @Column({ nullable: true })
  classificationId: string;
  @Column({ nullable: true })
  playlistId: string;
}
