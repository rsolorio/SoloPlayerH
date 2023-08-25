import { Column, Entity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ListItemEntity } from './base.entity';

@Entity({name: 'artist'})
export class ArtistEntity extends ListItemEntity implements IArtistModel {
  @Column()
  artistTypeId: string;
  @Column()
  countryId: string;
  @Column()
  favorite: boolean;
  @Column()
  artistSort: string;
  @Column()
  artistStylized: string;

  country: string;
  albumCount: number;
  songCount: number;
  playCount: number;
  songAddDateMax: Date;

}
