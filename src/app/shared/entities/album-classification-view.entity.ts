import { ViewColumn, ViewEntity } from 'typeorm';
import { IAlbumModel } from '../models/album-model.interface';
import { IArtistModel } from '../models/artist-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * This view combines the album entity with the classification entity.
 * It is intended to be used by filtering using the classificationId column;
 * if that's not the case, the view will return duplicate album records.
 * If using more than one classificationId values, you will need to use a DISTINCT clause.
 * Fields: id, primaryArtistId, name, albumSort, releaseYear, artistName, artistStylized, classificationId, songCount
 */
 @ViewEntity({
  name: 'albumClassificationView',
  expression: `
  SELECT album.id, album.primaryArtistId, album.name, album.albumSort, album.releaseYear, artist.name AS artistName, artist.artistStylized AS artistStylized, songClass.classificationId, COUNT(songClass.id) AS songCount
  FROM album INNER JOIN artist
  ON album.primaryArtistId = artist.id INNER JOIN (
    SELECT song.id, song.primaryAlbumId, songClassification.classificationId
    FROM song INNER JOIN songClassification
    ON song.id = songClassification.songId
  ) AS songClass
  ON album.id = songClass.primaryAlbumId
  GROUP BY album.id, album.primaryArtistId, album.name, album.albumSort, album.releaseYear, artist.name, artist.artistStylized, songClass.classificationId
`
})
export class AlbumClassificationViewEntity extends ListItemEntity implements IAlbumModel {
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
  artistStylized: string;
  @ViewColumn()
  albumSort: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  classificationId: string;

  albumType: string;
  favorite: boolean;
  primaryArtist: IArtistModel;
}
