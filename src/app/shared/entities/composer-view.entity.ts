import { ViewEntity } from 'typeorm';
import { ArtistViewEntity } from './artist-view.entity';
import { PartyRelationType } from '../models/music.enum';
import { artistViewExpression } from './artist-view-base.entity';

/**
 * Retrieves all the records from the artist table with associated songs as composer.
 * Fields: id, name, hash, artistSort, artistStylized, artistType, country, favorite, albumCount, songCount, playCount, seconds, songAddDateMax
 */
@ViewEntity({
  name: 'composerView',
  expression: artistViewExpression.replace('%partyRelationWhereClause%',
  `WHERE partyRelation.relationTypeId = '${PartyRelationType.Composer}'`)
})
export class ComposerViewEntity extends ArtistViewEntity {
}
