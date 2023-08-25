import { ViewColumn, ViewEntity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * This view combines the album entity with the classification entity.
 * It is intended to be used by filtering using the classificationId column;
 * if that's not the case, the view will return duplicate album records.
 * If using more than one classificationId values, you will need to use a DISTINCT clause.
 * Fields: id, primaryArtistId, name, hash, albumSort, releaseYear, releaseDecade, favorite, primaryArtistName, primaryArtistStylized, classificationId, songCount, playCount, seconds, songAddDateMax
 */
 @ViewEntity({
  name: 'albumClassificationView',
  expression: `
  SELECT album.id, album.primaryArtistId, album.name, album.hash, album.albumSort, album.releaseYear, album.releaseDecade, album.favorite, artist.name AS primaryArtistName, artist.artistStylized AS primaryArtistStylized, songClass.classificationId, COUNT(songClass.id) AS songCount, SUM(songClass.playCount) AS playCount, SUM(songClass.seconds) AS seconds, MAX(songClass.addDate) AS songAddDateMax
  FROM album INNER JOIN artist
  ON album.primaryArtistId = artist.id INNER JOIN (
    SELECT song.id, song.primaryAlbumId, song.playCount, song.seconds, song.addDate, songClassification.classificationId
    FROM song INNER JOIN songClassification
    ON song.id = songClassification.songId
  ) AS songClass
  ON album.id = songClass.primaryAlbumId
  GROUP BY album.id, album.primaryArtistId, album.name, album.albumSort, album.releaseYear, album.releaseDecade, album.favorite, artist.name, artist.artistStylized, songClass.classificationId
`
})
export class AlbumClassificationViewEntity extends ListItemEntity implements IAlbumModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
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
  classificationId: string;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  songAddDateMax: Date;

  albumTypeId: string;
}
