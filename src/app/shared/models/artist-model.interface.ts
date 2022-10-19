import { IListModel } from './base-model.interface';

export interface IArtistModel extends IListModel {
  artistType: string;
  country: string;
  favorite: boolean;
  albumCount: number;
  songCount: number;
}
