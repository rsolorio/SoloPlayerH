import { ViewColumn, ViewEntity } from 'typeorm';
import { IPlaylistModel } from '../models/playlist-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * Fields: id, name, hash, description, favorite, songCount, seconds
 */
 @ViewEntity({
  name: 'playlistView',
  expression: `
  SELECT playlist.id, playlist.name, playlist.hash, playlist.description, playlist.favorite, playlistSongCalculations.songCount, playlistSongCalculations.seconds
  FROM playlist INNER JOIN (
    SELECT playlistSong.playlistId, COUNT(playlistSong.songId) AS songCount, SUM(song.seconds) AS seconds
    FROM playlistSong INNER JOIN song ON playlistSong.songId = song.id
    GROUP BY playlistSong.playlistId
  ) AS playlistSongCalculations ON playlist.id = playlistSongCalculations.playlistId
`
})
export class PlaylistViewEntity extends ListItemEntity implements IPlaylistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  @ViewColumn()
  description: string;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  seconds: number;
}
