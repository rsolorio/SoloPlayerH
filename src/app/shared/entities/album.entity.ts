import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Relation } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { ArtistEntity } from './artist.entity';
import { DbEntity } from './base.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'album'})
export class AlbumEntity extends DbEntity implements IAlbumModel {
  @Column()
  albumType: string;

  @Column()
  releaseYear: number;

  @Column()
  favorite: boolean;

  @ManyToOne(type => ArtistEntity, artist => artist.albums)
  @JoinColumn({ name: 'primaryArtistId'})
  primaryArtist: Relation<ArtistEntity>;

  @OneToMany(type => SongEntity, song => song.primaryAlbum)
  songs: Relation<SongEntity[]>;

  songCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
