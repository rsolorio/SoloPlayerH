import { ViewColumn } from "typeorm";
import { IArtistModel } from "../models/artist-model.interface";
import { ListItemEntity } from "./base.entity";

export const artistViewExpression = `
  SELECT artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.artistType, artist.country, artist.favorite,
  0 AS albumCount, COUNT(partyRelation.songId) AS songCount, 0 AS playCount, 0 AS seconds, NULL AS songAddDateMax
  FROM artist
  LEFT JOIN (
    SELECT relatedId, songId
    FROM partyRelation
    %partyRelationWhereClause%
  ) AS partyRelation
  ON artist.id = partyRelation.relatedId
  GROUP BY artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.artistType, artist.country, artist.favorite
`;

export class ArtistViewBaseEntity extends ListItemEntity implements IArtistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  @ViewColumn()
  artistSort: string;
  @ViewColumn()
  artistStylized: string;
  @ViewColumn()
  artistType: string;  
  @ViewColumn()
  country: string;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  albumCount: number;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  songAddDateMax: Date;

  // These don't look like are needed in the view
  artistGender: string;
  vocal: boolean;
}