import { Column, Entity } from 'typeorm';
import { IdNameEntity } from './base.entity';

@Entity({name: 'song'})
export class SongEntity extends IdNameEntity {
  @Column({ unique: true })
  filePath: string;

  @Column()
  primaryAlbumId: string;

  @Column({ nullable: true })
  externalId: string;

  @Column()
  trackNumber: number;

  @Column()
  mediaNumber: number;

  @Column()
  releaseYear: number;

  @Column()
  releaseDecade: number;

  @Column({ nullable: true })
  composer: string;

  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true })
  addDate: Date;

  @Column({ nullable: true })
  changeDate: Date;

  @Column()
  language: string;

  @Column()
  mood: string;

  @Column()
  playCount: number;

  @Column()
  rating: number;

  @Column({ nullable: true })
  lyrics: string;

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
  fullyParsed: boolean;
}
