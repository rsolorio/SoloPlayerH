import { Column, Entity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { ListItemEntity } from './base.entity';

@Entity({name: 'album'})
export class AlbumEntity extends ListItemEntity implements IAlbumModel {
  @Column()
  primaryArtistId: string;
  @Column({ nullable: true })
  description: string;
  @Column()
  albumType: string;
  @Column()
  releaseYear: number;
  @Column()
  releaseDecade: number;
  @Column()
  favorite: boolean;
  @Column()
  albumSort: string;
  @Column()
  albumStylized: string;
  @Column({ nullable: true })
  publisher: string;
  @Column({ nullable: true })
  mbId: string;

  primaryArtistName: string;
  primaryArtistStylized: string;
  songCount: number;
  playCount: number;
  seconds: number;
  songAddDateMax: Date;
}
