import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'song'})
export class Song extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
  albumId: string;
  trackNumber: number;
  mediaNumber: number;
  releaseYear: number;
  releaseDecade: number;
  composer: string;
  addDate: Date;
  changeDate: Date;
  language: string;
  mood: string;
  playCount: number;
  rating: number;
  filePath: string;
  lyrics: string;
}
