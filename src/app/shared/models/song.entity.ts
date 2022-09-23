import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'song'})
export class SongEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filePath: string;

  @Column()
  name: string;

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
  vbr: boolean;

  @Column()
  replayGain: number;
}
