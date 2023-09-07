import { IListItemModel } from './base-model.interface';

export interface IArtistModel extends IListItemModel {
  artistType: string;
  artistGender: string;
  favorite: boolean;
  vocal: boolean;
  artistSort: string;
  artistStylized: string;
  country: string;
  albumCount: number;
  songCount: number;
  playCount: number;
  songAddDateMax: Date;
}
