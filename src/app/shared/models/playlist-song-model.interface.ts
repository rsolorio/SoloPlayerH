import { IListModel } from './base-model.interface';
import { PlayerSongStatus } from './player.enum';

export interface IPlaylistSongModel extends IListModel {
  playlistId: string;
  id: string;
  name: string;
  filePath: string;
  seconds: number;
  sequence: number;
  albumName: string;
  artistName: string;

  playerStatus: PlayerSongStatus;
}