import { ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ArtistViewBaseEntity } from './artist-view-base.entity';
import { PartyRelationType } from '../models/music.enum';

/**
 * Retrieves all the records from the artist table with associated songs as primary or featuring artist.
 * Fields: id, name, hash, artistSort, artistStylized, artistType, country, favorite, albumCount, songCount, playCount, seconds, songAddDateMax
 */
@ViewEntity({
  name: 'artistView',
  expression: `
    SELECT artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.artistType, artist.country, artist.favorite,
    0 AS albumCount, COUNT(partyRelation.songId) AS songCount, 0 AS playCount, 0 AS seconds, NULL AS songAddDateMax
    FROM artist
    LEFT JOIN (
      SELECT relatedId, songId
      FROM partyRelation
      WHERE partyRelation.relationTypeId = '${PartyRelationType.Primary}' OR partyRelation.relationTypeId = '${PartyRelationType.Featuring}'
    ) AS partyRelation
    ON artist.id = partyRelation.relatedId
    GROUP BY artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.favorite
  `
})
export class ArtistViewEntity extends ArtistViewBaseEntity implements IArtistModel {
}
