import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Relation } from 'typeorm';
import { ArtistEntity } from './artist.entity';
import { IdNameEntity } from './base.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'album'})
export class AlbumEntity extends IdNameEntity {
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
}
