import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * Fields: id, name, artistSort, artistStylized, songCount
 */
@ViewEntity({
  name: 'artistView',
  expression: `
    SELECT artist.id, artist.name, artist.artistSort, artist.artistStylized, COUNT(artist.id) AS songCount, NULL AS songAddDateMax
    FROM artist
    INNER JOIN partyRelation
    ON artist.id = partyRelation.relatedId
    INNER JOIN song
    ON partyRelation.songId = song.id
    WHERE partyRelation.relationTypeId = 'Artist-Song-Primary' OR partyRelation.relationTypeId = 'Artist-Song-Featuring'
    GROUP BY artist.id
  `
})
export class ArtistViewEntity extends ListItemEntity implements IArtistModel {
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
  songAddDateMax: Date;

  artistTypeId: string;
  countryId: string;
  favorite: boolean;
  albumCount: number;
}
