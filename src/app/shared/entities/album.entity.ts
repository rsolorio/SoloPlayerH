import { Column, Entity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { ListItemEntity } from './base.entity';

@Entity({name: 'album'})
export class AlbumEntity extends ListItemEntity implements IAlbumModel {
  @Column()
  primaryArtistId: string;
  @Column()
  albumTypeId: string;
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

  primaryArtistName: string;
  primaryArtistStylized: string;
  songCount: number;
  playCount: number;
  seconds: number;
  songAddDateMax: Date;
}
