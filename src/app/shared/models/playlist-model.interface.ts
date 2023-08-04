import { IListItemModel } from './base-model.interface';

export interface IPlaylistModel extends IListItemModel {
  description: string;
  songCount: number;
  seconds: number;
  favorite: boolean;
  changeDate: Date;
}
