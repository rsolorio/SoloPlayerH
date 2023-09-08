import { ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongViewBaseEntity, songViewBaseSelect, songViewBaseJoins } from './song-view-base.entity';

/**
 * View for performing basic filtering operations against the song table.
 * This view does not support filtering by artistId, classificationId or playlistId.
 */
@ViewEntity({
  name: 'songView',
  expression: `${songViewBaseSelect} ${songViewBaseJoins.replace('%songTable%', 'song')}`
})
export class SongViewEntity extends SongViewBaseEntity implements ISongModel {
}
