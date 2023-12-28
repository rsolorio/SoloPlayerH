import { ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ArtistViewBaseEntity, artistViewExpression } from './artist-view-base.entity';
import { PartyRelationType } from '../models/music.enum';

/**
 * Retrieves all the records from the artist table with associated songs as primary or featuring artist.
 * Contributors and singers are not considered in this condition because they are associated to other artists
 * and this query is about associations between artists and songs.
 * Fields: id, name, hash, artistSort, artistStylized, artistType, country, favorite, albumCount, songCount, playCount, seconds, songAddDateMax
 */
@ViewEntity({
  name: 'artistView',
  expression: artistViewExpression.replace('%partyRelationWhereClause%',
  `WHERE partyRelation.relationTypeId = '${PartyRelationType.Primary}' OR partyRelation.relationTypeId = '${PartyRelationType.Featuring}'`)
})
export class ArtistViewEntity extends ArtistViewBaseEntity implements IArtistModel {
}
