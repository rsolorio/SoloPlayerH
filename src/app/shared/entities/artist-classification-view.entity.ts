import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * This view combines the artist entity with the classification entity.
 * It is intended to be used by filtering using the classificationId column;
 * if that's not the case, the view will return duplicate artist records.
 * If using more than one classificationId values, you will need to use a DISTINCT clause.
 * Fields: id, name, artistSort, artistStylized, classificationId, albumCount, songCount
 */
 @ViewEntity({
  name: 'artistClassificationView',
  expression: `
  SELECT artist.id, artist.name, artist.artistSort, artist.artistStylized, albumClassification.classificationId, COUNT(albumClassification.id) AS albumCount, SUM(albumClassification.songCount) AS songCount
  FROM artist INNER JOIN (
    SELECT album.id, album.primaryArtistId, album.name, songClass.classificationId, COUNT(songClass.id) AS songCount
    FROM album INNER JOIN (
      SELECT song.id, song.primaryAlbumId, songClassification.classificationId
      FROM song INNER JOIN songClassification
      ON song.id = songClassification.songId
    ) AS songClass
    ON album.id = songClass.primaryAlbumId
    GROUP BY album.id, album.primaryArtistId, album.name, songClass.classificationId
  ) AS albumClassification
  ON artist.id = albumClassification.primaryArtistId
  GROUP BY artist.id, artist.name, artist.artistSort, artist.artistStylized, albumClassification.classificationId
`
})
export class ArtistClassificationViewEntity extends ListItemEntity implements IArtistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  artistSort: string;
  @ViewColumn()
  artistStylized: string;
  @ViewColumn()
  classificationId: string;
  @ViewColumn()
  albumCount: number;

  artistType: string;
  country: string;
  favorite: boolean;
}
