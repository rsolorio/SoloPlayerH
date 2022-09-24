import { Column, Entity } from 'typeorm';
import { IdNameEntity } from './base.entity';

@Entity({name: 'artist'})
export class ArtistEntity extends IdNameEntity {
  @Column()
  artistType: string;

  @Column()
  country: string;

  @Column()
  favorite: boolean;
}
