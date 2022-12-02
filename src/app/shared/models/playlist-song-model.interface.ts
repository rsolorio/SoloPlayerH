import { IListModel } from './base-model.interface';
import { IPlaylistModel } from './playlist-model.interface';
import { ISongModel } from './song-model.interface';

export interface IPlaylistSongModel extends IListModel {
  playlistId: string;
  songId: string;
  sequence: number;
  song: ISongModel;
  playlist: IPlaylistModel;
}