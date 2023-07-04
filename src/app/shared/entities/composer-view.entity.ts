import { ViewEntity } from 'typeorm';
import { ArtistViewEntity } from './artist-view.entity';

/**
 * Retrieves all the records from the artist table with associated songs as composer.
 * Fields: id, name, artistSort, artistStylized, songCount
 */
@ViewEntity({
  name: 'composerView',
  expression: `
    SELECT artist.id, artist.name, artist.artistSort, artist.artistStylized, COUNT(partyRelation.songId) AS songCount, NULL AS songAddDateMax
    FROM artist
    LEFT JOIN (
      SELECT relatedId, songId
      FROM partyRelation
      WHERE partyRelation.relationTypeId = 'Artist-Song-Composer'
    ) AS partyRelation
    ON artist.id = partyRelation.relatedId
    GROUP BY artist.id
  `
})
export class ComposerViewEntity extends ArtistViewEntity {
}
