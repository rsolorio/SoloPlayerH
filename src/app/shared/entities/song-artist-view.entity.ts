import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongViewBaseEntity, songViewBaseSelect, songViewBaseJoins } from './song-view-base.entity';
import { PartyRelationType } from '../models/music.enum';

/**
 * This view combines the song entity with the PartyRelation entity.
 * It only considers songs where the Artist is primary or featuring.
 * It can be used to determine which artists are related with a particular song filtering by id (songId).
 * It can be used to get all the songs associated with one artist filtering by artistId.
 * However, it cannot be used with multiple artists since it will not return unique song rows
 * since the artistId column is part of the query and it causes the song rows to be duplicated;
 * for instance, if two artists are associated with one song, you will get two song rows.
 */
 @ViewEntity({
  name: 'songArtistView',
  expression: `
  ${songViewBaseSelect}, partyRelation.relatedId AS artistId
  ${songViewBaseJoins.replace('%songTable%', 'song')}
  INNER JOIN partyRelation
  ON song.id = partyRelation.songId
  WHERE partyRelation.relationTypeId = '${PartyRelationType.Primary}'
  OR partyRelation.relationTypeId = '${PartyRelationType.Featuring}'
`})
export class SongArtistViewEntity extends SongViewBaseEntity implements ISongModel {
  @ViewColumn()
  artistId: string;
}
