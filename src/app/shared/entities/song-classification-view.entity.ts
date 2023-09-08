import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongViewBaseEntity, songViewBaseSelect, songViewBaseJoins } from './song-view-base.entity';

/**
 * This view combines the song entity with the songClassification entity.
 * It supports filtering by classificationId.
 */
 @ViewEntity({
  name: 'songClassificationView',
  expression: `
  ${songViewBaseSelect}, songClassification.classificationId AS classificationId
  ${songViewBaseJoins.replace('%songTable%', 'song')}
  INNER JOIN songClassification
  ON song.id = songClassification.songId
`})
export class SongClassificationViewEntity extends SongViewBaseEntity implements ISongModel {
  @ViewColumn()
  classificationId: string;
}
