import { Column, Entity, ManyToOne, Relation, JoinColumn, OneToMany } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { AlbumEntity } from './album.entity';
import { PlaylistSongEntity } from './playlist-song.entity';
import { SongArtistEntity } from './song-artist.entity';
import { SongBaseEntity } from './song-base.entity';
import { SongClassificationEntity } from './song-classification.entity';

@Entity({name: 'song'})
export class SongEntity extends SongBaseEntity implements ISongModel {
  @Column()
  titleSort: string;
  @Column({ unique: true })
  filePath: string;
  @Column()
  fileSize: number;
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
  genre: string;
  @Column({ nullable: true })
  composer: string;
  @Column({ nullable: true })
  comment: string;
  @Column({ nullable: true })
  addDate: Date;
  @Column({ nullable: true })
  changeDate: Date;
  @Column({ nullable: true })
  playDate: Date;
  @Column()
  language: string;
  @Column()
  mood: string;
  @Column({ nullable: true })
  grouping: string;
  @Column()
  initialPlayCount: number;
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
  @Column()
  live: boolean;

  @ManyToOne(() => AlbumEntity, album => album.songs)
  @JoinColumn({ name: 'primaryAlbumId'})
  primaryAlbum: Relation<AlbumEntity>;

  @OneToMany(() => SongArtistEntity, songArtist => songArtist.song)
  songArtists: Relation<SongArtistEntity[]>;

  @OneToMany(() => SongClassificationEntity, songClassification => songClassification.song)
  songClassifications: Relation<SongClassificationEntity[]>;

  @OneToMany(() => PlaylistSongEntity, playlistSong => playlistSong.song)
  playlistSongs: Relation<PlaylistSongEntity[]>;

  // Empty properties from ISongModel interface
  primaryAlbumId: string;
  primaryArtistId: string;
  classificationId: string;
}
