import { IListModel } from './base-model.interface';

export interface IArtistModel extends IListModel {
  artistType: string;
  country: string;
  favorite: boolean;
  artistSort: string;
  albumCount: number;
  songCount: number;
}
