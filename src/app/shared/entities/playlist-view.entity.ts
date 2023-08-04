import { ViewColumn, ViewEntity } from 'typeorm';
import { IPlaylistModel } from '../models/playlist-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * Get a list of playlists with song information, including playlists without tracks.
 * Fields: id, name, hash, description, favorite, changeDate, songCount, seconds
 */
 @ViewEntity({
  name: 'playlistView',
  expression: `
  SELECT playlist.id, playlist.name, playlist.hash, playlist.description, playlist.favorite, playlist.changeDate,
  COALESCE (playlistSongCalculations.songCount, 0) AS songCount, COALESCE (playlistSongCalculations.seconds, 0) AS seconds
  FROM playlist LEFT JOIN (
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
  changeDate: Date;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  seconds: number;
}
