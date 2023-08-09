import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * Retrieves all the records from the artist table with associated songs as primary or featuring artist.
 * Fields: id, name, hash, artistSort, artistStylized, favorite, songCount, songAddDateMax
 */
@ViewEntity({
  name: 'artistView',
  expression: `
    SELECT artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.favorite, COUNT(partyRelation.songId) AS songCount, NULL AS songAddDateMax
    FROM artist
    LEFT JOIN (
      SELECT relatedId, songId
      FROM partyRelation
      WHERE partyRelation.relationTypeId = 'Artist-Song-Primary' OR partyRelation.relationTypeId = 'Artist-Song-Featuring'
    ) AS partyRelation
    ON artist.id = partyRelation.relatedId
    GROUP BY artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized
  `
})
export class ArtistViewEntity extends ListItemEntity implements IArtistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  artistSort: string;
  @ViewColumn()
  artistStylized: string;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  songAddDateMax: Date;

  artistTypeId: string;
  countryId: string;
  country: string;
  albumCount: number;
}
