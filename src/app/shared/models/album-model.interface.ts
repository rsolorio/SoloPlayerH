import { IListModel } from './base-model.interface';

export interface IAlbumModel extends IListModel {
  albumType: string;
  releaseYear: number;
  favorite: boolean;
  albumSort: string;
  artistName: string;
  songCount: number;
}
