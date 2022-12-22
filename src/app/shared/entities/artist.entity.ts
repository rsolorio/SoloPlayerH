import { Column, Entity, ManyToMany, OneToMany, Relation } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { AlbumEntity } from './album.entity';
import { ListItemEntity } from './base.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'artist'})
export class ArtistEntity extends ListItemEntity implements IArtistModel {
  @Column()
  artistType: string;
  @Column()
  country: string;
  @Column()
  favorite: boolean;
  @Column()
  artistSort: string;
  @Column()
  artistStylized: string;

  @OneToMany(type => AlbumEntity, album => album.primaryArtist )
  albums: Relation<AlbumEntity[]>;

  @ManyToMany(() => SongEntity, song => song.artists)
  songs: Relation<SongEntity[]>;

  albumCount: number;
  songCount: number;
}
