import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Relation } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { ArtistEntity } from './artist.entity';
import { ListItemEntity } from './base.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'album'})
export class AlbumEntity extends ListItemEntity implements IAlbumModel {
  @Column()
  albumTypeId: string;
  @Column()
  releaseYear: number;
  @Column()
  releaseDecade: number;
  @Column()
  favorite: boolean;
  @Column()
  albumSort: string;

  @ManyToOne(() => ArtistEntity, artist => artist.albums)
  @JoinColumn({ name: 'primaryArtistId'})
  primaryArtist: Relation<ArtistEntity>;

  @OneToMany(() => SongEntity, song => song.primaryAlbum)
  songs: Relation<SongEntity[]>;

  artistName: string;
  artistStylized: string;
  songCount: number;
  seconds: number;
  songAddDateMax: Date;
}
