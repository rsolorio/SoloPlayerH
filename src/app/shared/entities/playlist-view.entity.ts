import { ViewColumn, ViewEntity } from 'typeorm';
import { IPlaylistModel } from '../models/playlist-model.interface';

/**
 * Fields: id, name, artistSort, albumCount, songCount
 */
 @ViewEntity({
  expression: `
  SELECT playlist.id, playlist.name, playlist.description, playlistSongCalculations.songCount, playlistSongCalculations.seconds
  FROM playlist INNER JOIN (
    SELECT playlistSong.playlistId, COUNT(playlistSong.songId) AS songCount, SUM(song.seconds) AS seconds
    FROM playlistSong INNER JOIN song ON playlistSong.songId = song.id
    GROUP BY playlistSong.playlistId
  ) AS playlistSongCalculations ON playlist.id = playlistSongCalculations.playlistId
`
})
export class PlaylistViewEntity implements IPlaylistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  description: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  seconds: number;

  favorite: boolean;
  canBeRendered: boolean;
  imageSrc: string;
}
