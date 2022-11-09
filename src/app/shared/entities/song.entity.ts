import { Column, Entity, ManyToOne, Relation, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { AlbumEntity } from './album.entity';
import { ArtistEntity } from './artist.entity';
import { DbEntity } from './base.entity';
import { ClassificationEntity } from './classification.entity';

@Entity({name: 'song'})
export class SongEntity extends DbEntity implements ISongModel {
  @Column()
  titleSort: string;
  @Column({ unique: true })
  filePath: string;
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
  @Column()
  favorite: boolean;

  @ManyToOne(type => AlbumEntity, album => album.songs)
  @JoinColumn({ name: 'primaryAlbumId'})
  primaryAlbum: Relation<AlbumEntity>;

  @ManyToMany(() => ArtistEntity, artist => artist.songs)
  @JoinTable({ name: 'songArtist' })
  artists: Relation<ArtistEntity[]>;

  @ManyToMany(() => ClassificationEntity, classification => classification.songs)
  @JoinTable({ name: 'songClassification' })
  classifications: Relation<ClassificationEntity[]>;

  albumName: string;
  artistName: string;
  imageSrc: string;
  canBeRendered: boolean;
}
