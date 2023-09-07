import { ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ArtistViewBaseEntity } from './artist-view-base.entity';

/**
 * Retrieves all the records from the artist table with associated songs as primary or featuring artist.
 * Fields: id, name, hash, artistSort, artistStylized, artistType, country, favorite, albumCount, songCount, playCount, songAddDateMax
 */
@ViewEntity({
  name: 'artistView',
  expression: `
    SELECT artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.artistType, artist.country, artist.favorite,
    0 AS albumCount, COUNT(partyRelation.songId) AS songCount, 0 AS playCount, NULL AS songAddDateMax
    FROM artist
    LEFT JOIN (
      SELECT relatedId, songId
      FROM partyRelation
      WHERE partyRelation.relationTypeId = 'Artist-Song-Primary' OR partyRelation.relationTypeId = 'Artist-Song-Featuring'
    ) AS partyRelation
    ON artist.id = partyRelation.relatedId
    GROUP BY artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.favorite
  `
})
export class ArtistViewEntity extends ArtistViewBaseEntity implements IArtistModel {
}
