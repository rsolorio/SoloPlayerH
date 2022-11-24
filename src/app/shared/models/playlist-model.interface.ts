import { IListModel } from './base-model.interface';

export interface IPlaylistModel extends IListModel {
  description: string;
  songCount: number;
  seconds: number;
  favorite: boolean;
}
