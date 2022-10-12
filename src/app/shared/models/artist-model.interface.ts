import { IDbModel } from './base-model.interface';

export interface IArtistModel extends IDbModel {
  artistType: string;
  country: string;
  favorite: boolean;
  albumCount: number;
  songCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
