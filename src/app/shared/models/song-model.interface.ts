import { IDbModel } from './base-model.interface';

export interface ISongModel extends IDbModel {
  filePath: string;
  playCount: number;
  releaseYear: number;
  favorite: boolean;
  albumName: string;
  artistName: string;
  imageSrc: string;
  canBeRendered: boolean;
}
