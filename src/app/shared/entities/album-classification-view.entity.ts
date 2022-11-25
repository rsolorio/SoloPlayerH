import { ViewColumn, ViewEntity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { ListEntity } from './base.entity';

/**
 * This view combines the album entity with the classification entity.
 * It is intended to be used by filtering using the classificationId column;
 * if that's not the case, the view will return duplicate album records.
 * If using more than one classificationId values, you will need to use a DISTINCT clause.
 * Fields: id, primaryArtistId, name, albumSort, releaseYear, artistName, classificationId, songCount
 */
 @ViewEntity({
  expression: `
  SELECT album.id, album.primaryArtistId, album.name, album.albumSort, album.releaseYear, artist.name AS artistName, songClass.classificationId, COUNT(songClass.id) AS songCount
  FROM album INNER JOIN artist
  ON album.primaryArtistId = artist.id INNER JOIN (
    SELECT song.id, song.primaryAlbumId, songClassification.classificationId
    FROM song INNER JOIN songClassification
    ON song.id = songClassification.songId
  ) AS songClass
  ON album.id = songClass.primaryAlbumId
  GROUP BY album.id, album.primaryArtistId, album.name, album.albumSort, album.releaseYear, artist.name, songClass.classificationId
`
})
export class AlbumClassificationViewEntity extends ListEntity implements IAlbumModel {
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
  @ViewColumn()
  albumSort: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  classificationId: string;

  albumType: string;
  favorite: boolean;
}
