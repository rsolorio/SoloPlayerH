import { ViewColumn, ViewEntity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { AlbumEntity } from './album.entity';

@ViewEntity({
  expression: ds => ds
    .createQueryBuilder(AlbumEntity, 'album')
    .innerJoin('album.songs', 'song')
    .select('album.id', 'id')
    .addSelect('album.name', 'name')
    .addSelect('album.releaseYear', 'releaseYear')
    .addSelect('COUNT(album.id)', 'songCount')
    .groupBy('album.id')
})
export class AlbumViewEntity implements IAlbumModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  songCount: number;

  albumType: string;
  releaseYear: number;
  favorite: boolean;
  imageSrc: string;
  canBeRendered: boolean;
}
