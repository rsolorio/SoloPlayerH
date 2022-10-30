import { Column, Entity, ManyToMany, OneToMany, Relation } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { AlbumEntity } from './album.entity';
import { DbEntity } from './base.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'artist'})
export class ArtistEntity extends DbEntity implements IArtistModel {
  @Column()
  artistType: string;

  @Column()
  country: string;

  @Column()
  favorite: boolean;

  @Column()
  artistSort: string;

  @OneToMany(type => AlbumEntity, album => album.primaryArtist )
  albums: Relation<AlbumEntity[]>;

  @ManyToMany(() => SongEntity, song => song.artists)
  songs: Relation<SongEntity[]>;

  selected: boolean;
  albumCount: number;
  songCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
