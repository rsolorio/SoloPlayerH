import { IDbModel } from './base-model.interface';

export interface IAlbumModel extends IDbModel {
  albumType: string;
  releaseYear: number;
  favorite: boolean;
  songCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
