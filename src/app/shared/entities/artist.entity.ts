import { Column, Entity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ListItemEntity } from './base.entity';

@Entity({name: 'artist'})
export class ArtistEntity extends ListItemEntity implements IArtistModel {
  @Column()
  artistSort: string;
  @Column()
  artistStylized: string;
  @Column()
  artistType: string;
  @Column()
  artistGender: string;
  @Column()
  country: string;
  @Column()
  favorite: boolean;
  @Column()
  vocal: boolean;

  // Properties for views
  albumCount: number;
  songCount: number;
  playCount: number;
  songAddDateMax: Date;
}
