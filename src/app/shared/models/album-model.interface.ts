import { IDbModel } from './base-model.interface';

export interface IAlbumModel extends IDbModel {
  albumType: string;
  releaseYear: number;
  favorite: boolean;
  artistName: string;
  songCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
