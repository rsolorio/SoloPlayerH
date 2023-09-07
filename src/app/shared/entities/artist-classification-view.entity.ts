import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ArtistViewBaseEntity } from './artist-view-base.entity';

/**
 * This view combines the artist entity with the classification entity.
 * It will return album artists associated with a classification.
 * It is intended to be used by filtering using the classificationId column;
 * if that's not the case, the view will return duplicate artist records.
 * If using more than one classificationId values, you will need to use a DISTINCT clause.
 * Fields: id, name, hash, artistSort, artistStylized, artistType, country, favorite, classificationId, albumCount, songCount, playCount, songAddDateMax
 */
 @ViewEntity({
  name: 'artistClassificationView',
  expression: `
  SELECT artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.artistType, artist.country, artist.favorite,
  albumClassification.classificationId, COUNT(albumClassification.id) AS albumCount, SUM(albumClassification.songCount) AS songCount, SUM(albumClassification.playCount) AS playCount, MAX(albumClassification.songAddDateMax) AS songAddDateMax
  FROM artist
  INNER JOIN (
    SELECT album.id, album.primaryArtistId, album.name, songClass.classificationId, COUNT(songClass.id) AS songCount, SUM(songClass.playCount) AS playCount, MAX(songClass.addDate) AS songAddDateMax
    FROM album INNER JOIN (
      SELECT song.id, song.primaryAlbumId, song.addDate, song.playCount, songClassification.classificationId
      FROM song INNER JOIN songClassification
      ON song.id = songClassification.songId
    ) AS songClass
    ON album.id = songClass.primaryAlbumId
    GROUP BY album.id, album.primaryArtistId, album.name, songClass.classificationId
  ) AS albumClassification
  ON artist.id = albumClassification.primaryArtistId
  GROUP BY artist.id, artist.name, artist.artistSort, artist.artistStylized, artist.artistType, artist.country, artist.favorite, albumClassification.classificationId
`
})
export class ArtistClassificationViewEntity extends ArtistViewBaseEntity implements IArtistModel {
  @ViewColumn()
  classificationId: string;
}
