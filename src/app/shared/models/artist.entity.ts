import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { AlbumEntity } from './album.entity';
import { IdNameEntity } from './base.entity';

@Entity({name: 'artist'})
export class ArtistEntity extends IdNameEntity {
  @Column()
  artistType: string;

  @Column()
  country: string;

  @Column()
  favorite: boolean;

  @OneToMany(type => AlbumEntity, album => album.primaryArtist )
  albums: Relation<AlbumEntity[]>;
}
