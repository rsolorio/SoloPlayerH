import { ISongModel } from './song-model.interface';

export interface IPlaylistSongModel extends ISongModel {
  playlistId: string;
  songId: string;
  sequence: number;
}