import { IListModel } from './base-model.interface';

export interface IAlbumModel extends IListModel {
  albumType: string;
  releaseYear: number;
  favorite: boolean;
  artistName: string;
  songCount: number;
}
