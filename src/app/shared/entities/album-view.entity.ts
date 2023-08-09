import { ViewColumn, ViewEntity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { IArtistModel } from '../models/artist-model.interface';
import { AlbumEntity } from './album.entity';
import { ListItemEntity } from './base.entity';

/**
 * Fields: id, primaryArtistId, name, hash, albumSort, releaseYear, releaseDecade, favorite, artistName, artistStylized, songCount, songAddDateMax
 */
@ViewEntity({
  name: 'albumView',
  expression: ds => ds
    .createQueryBuilder(AlbumEntity, 'album')
    .innerJoin('album.primaryArtist', 'artist')
    .innerJoin('album.songs', 'song')
    .select('album.id', 'id')
    .addSelect('artist.id', 'primaryArtistId')
    .addSelect('album.name', 'name')
    .addSelect('album.hash', 'hash')
    .addSelect('album.albumSort', 'albumSort')
    .addSelect('album.releaseYear', 'releaseYear')
    .addSelect('album.releaseDecade', 'releaseDecade')
    .addSelect('album.favorite', 'favorite')
    .addSelect('artist.name', 'artistName')
    .addSelect('artist.artistStylized', 'artistStylized')
    .addSelect('COUNT(album.id)', 'songCount')
    .addSelect('SUM(song.seconds)', 'seconds')
    .addSelect('MAX(song.addDate)', 'songAddDateMax')
    .groupBy('album.id')
})
export class AlbumViewEntity extends ListItemEntity implements IAlbumModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  releaseYear: number;
  @ViewColumn()
  releaseDecade: number;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  artistName: string;
  @ViewColumn()
  artistStylized: string;
  @ViewColumn()
  albumSort: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  songAddDateMax: Date;

  albumTypeId: string;
  primaryArtist: IArtistModel;
}
