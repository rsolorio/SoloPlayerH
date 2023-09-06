import { Column, Entity } from 'typeorm';
import { ISongFullModel } from '../models/song-model.interface';
import { SongBaseEntity } from './song-base.entity';

@Entity({name: 'song'})
export class SongEntity extends SongBaseEntity implements ISongFullModel {
  // Ids
  @Column()
  primaryAlbumId: string;
  @Column({ nullable: true })
  externalId: string;
  // File info
  @Column({ unique: true })
  filePath: string;
  @Column()
  fileSize: number;
  // Song info
  @Column()
  titleSort: string;
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
  @Column({ nullable: true })
  genre: string;
  @Column()
  mood: string;
  @Column()
  language: string;
  @Column({ nullable: true })
  lyrics: string;
  @Column({ nullable: true })
  grouping: string;
  @Column({ nullable: true })
  composer: string;
  @Column({ nullable: true })
  composerSort: string;
  @Column({ nullable: true })
  comment: string;
  @Column({ nullable: true })
  infoUrl: string;
  @Column({ nullable: true })
  videoUrl: string;
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
  @Column()
  replayGain: number;
  @Column()
  tempo: number;
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
  @Column()
  changeDate: Date;
  @Column({ nullable: true })
  playDate: Date;
  @Column({ nullable: true })
  replaceDate: Date;
}
