import { ViewColumn, ViewEntity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { AlbumEntity } from './album.entity';
import { ListItemEntity } from './base.entity';

/**
 * Fields: id, primaryArtistId, name, hash, albumSort, releaseYear, releaseDecade, favorite, primaryArtistName, primaryArtistStylized, songCount, playCount, seconds, songAddDateMax
 */
@ViewEntity({
  name: 'albumView',
  expression: ds => ds
    .createQueryBuilder(AlbumEntity, 'album')
    .innerJoin('artist', 'artist', 'album.primaryArtistId = artist.id')
    .innerJoin('song', 'song', 'album.id = song.primaryAlbumId')
    .select('album.id', 'id')
    .addSelect('artist.id', 'primaryArtistId')
    .addSelect('album.name', 'name')
    .addSelect('album.hash', 'hash')
    .addSelect('album.albumType', 'albumType')
    .addSelect('album.albumSort', 'albumSort')
    .addSelect('album.releaseYear', 'releaseYear')
    .addSelect('album.releaseDecade', 'releaseDecade')
    .addSelect('album.favorite', 'favorite')
    .addSelect('artist.name', 'primaryArtistName')
    .addSelect('artist.artistStylized', 'primaryArtistStylized')
    .addSelect('COUNT(album.id)', 'songCount')
    .addSelect('SUM(song.playCount)', 'playCount')
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
  albumType: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  releaseYear: number;
  @ViewColumn()
  releaseDecade: number;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  primaryArtistName: string;
  @ViewColumn()
  primaryArtistStylized: string;
  @ViewColumn()
  albumSort: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  songAddDateMax: Date;
}
