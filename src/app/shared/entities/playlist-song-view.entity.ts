import { ViewColumn, ViewEntity } from 'typeorm';
import { IPlaylistSongModel } from '../models/playlist-song-model.interface';
import { SongViewBaseEntity, songViewBaseSelect, songViewBaseJoins } from './song-view-base.entity';

/**
 * View that integrates the song information with the playlist song data.
 * Besides the regular song view fields, this view includes these extra fields: playlistId, songId, sequence.
 */
@ViewEntity({
  name: 'playlistSongView',
  expression: `
  ${songViewBaseSelect}, playlistSong.playlistId, playlistSong.songId, playlistSong.sequence
  ${songViewBaseJoins.replace('%songTable%', 'song')}
  INNER JOIN playlistSong
  ON song.id = playlistSong.songId
`})
export class PlaylistSongViewEntity extends SongViewBaseEntity implements IPlaylistSongModel {
  @ViewColumn()
  sequence: number;
  @ViewColumn()
  playlistId: string;
  @ViewColumn()
  songId: string;
}
