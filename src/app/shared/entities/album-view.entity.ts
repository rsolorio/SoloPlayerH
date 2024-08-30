import { ViewColumn, ViewEntity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * Fields: id, primaryArtistId, name, hash, description, albumType, albumSort, releaseYear, releaseDecade, favorite, primaryArtistName, primaryArtistStylized, songCount, playCount, seconds, songAddDateMax
 */
@ViewEntity({
  name: 'albumView',
  expression: `
    SELECT album.id, album.primaryArtistId, album.name, album.hash, album.description, album.albumType, album.albumSort, album.releaseYear, album.releaseDecade, album.favorite,
    artist.name AS primaryArtistName, artist.artistStylized AS primaryArtistStylized,
    COUNT(song.id) AS songCount, SUM(song.playCount) AS playCount, SUM(song.seconds) AS seconds, MAX(song.addDate) AS songAddDateMax
    FROM album
    INNER JOIN artist
    ON album.primaryArtistId = artist.id
    LEFT JOIN song
    ON song.primaryAlbumId = album.id
    GROUP BY album.id, album.primaryArtistId, album.name, album.hash, album.description, album.albumType, album.albumSort, album.releaseYear, album.releaseDecade, album.favorite
  `
})
export class AlbumViewEntity extends ListItemEntity implements IAlbumModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  @ViewColumn()
  description: string;
  @ViewColumn()
  albumType: string;
  @ViewColumn()
  albumSort: string;
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
  songCount: number;
  @ViewColumn()
  playCount: number;  
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  songAddDateMax: Date;
}
