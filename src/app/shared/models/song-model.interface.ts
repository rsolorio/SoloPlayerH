import { IListModel } from './base-model.interface';

export interface ISongModel extends IListModel {
  filePath: string;
  playCount: number;
  releaseYear: number;
  favorite: boolean;
  albumName: string;
  artistName: string;
}
