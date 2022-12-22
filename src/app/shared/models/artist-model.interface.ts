import { IListItemModel } from './base-model.interface';

export interface IArtistModel extends IListItemModel {
  artistType: string;
  country: string;
  favorite: boolean;
  artistSort: string;
  artistStylized: string;
  albumCount: number;
  songCount: number;
}
