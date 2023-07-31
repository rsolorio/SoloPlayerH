import { IListItemModel } from './base-model.interface';

export interface IArtistModel extends IListItemModel {
  artistTypeId: string;
  countryId: string;
  favorite: boolean;
  artistSort: string;
  artistStylized: string;
  country: string;
  albumCount: number;
  songCount: number;
  songAddDateMax: Date;
}
