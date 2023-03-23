import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { AlbumEntity } from './album.entity';
import { ListItemEntity } from './base.entity';
import { SongArtistEntity } from './song-artist.entity';

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

  @OneToMany(() => AlbumEntity, album => album.primaryArtist)
  albums: Relation<AlbumEntity[]>;

  @OneToMany(() => SongArtistEntity, songArtist => songArtist.artist)
  songArtists: Relation<SongArtistEntity[]>;

  albumCount: number;
  songCount: number;
  songAddDateMax: Date;
}
