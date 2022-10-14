import { ViewColumn, ViewEntity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { AlbumEntity } from './album.entity';

@ViewEntity({
  expression: ds => ds
    .createQueryBuilder(AlbumEntity, 'album')
    .innerJoin('album.primaryArtist', 'artist')
    .innerJoin('album.songs', 'song')
    .select('album.id', 'id')
    .addSelect('album.name', 'name')
    .addSelect('album.releaseYear', 'releaseYear')
    .addSelect('artist.name', 'artistName')
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
  @ViewColumn()
  releaseYear: number;
  @ViewColumn()
  artistName: string;

  albumType: string;
  favorite: boolean;
  imageSrc: string;
  canBeRendered: boolean;
}
