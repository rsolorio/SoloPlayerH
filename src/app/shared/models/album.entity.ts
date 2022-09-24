import { Column, Entity } from 'typeorm';
import { IdNameEntity } from './base.entity';

@Entity({name: 'album'})
export class AlbumEntity extends IdNameEntity {
  @Column()
  primaryArtistId: string;

  @Column()
  albumType: string;

  @Column()
  releaseYear: number;

  @Column()
  favorite: boolean;
}
