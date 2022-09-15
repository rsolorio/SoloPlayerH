import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'song'})
export class Song extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filePath: string;

  @Column()
  name: string;

  @Column()
  albumId: string;

  @Column({ nullable: true })
  trackNumber: number;

  @Column({ nullable: true })
  mediaNumber: number;

  @Column({ nullable: true })
  releaseYear: number;

  @Column({ nullable: true })
  releaseDecade: number;

  @Column({ nullable: true })
  composer: string;

  @Column({ nullable: true })
  addDate: Date;

  @Column({ nullable: true })
  changeDate: Date;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  mood: string;

  @Column({ nullable: true })
  playCount: number;

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  lyrics: string;
}
