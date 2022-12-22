import { IArtistModel } from './artist-model.interface';
import { IListItemModel } from './base-model.interface';

export interface IAlbumModel extends IListItemModel {
  albumType: string;
  releaseYear: number;
  favorite: boolean;
  albumSort: string;
  artistName: string;
  artistStylized: string;
  songCount: number;
  primaryArtist: IArtistModel;
}
