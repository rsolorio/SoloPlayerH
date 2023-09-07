import { IListItemModel } from './base-model.interface';

export interface IAlbumModel extends IListItemModel {
  albumType: string;
  releaseYear: number;
  releaseDecade: number;
  favorite: boolean;
  albumSort: string;
  /** Name of the artist. Unavailable in AlbumEntity. */
  primaryArtistName: string;
  /** Stylized name of the artist. Unavailable in AlbumEntity. */
  primaryArtistStylized: string;
  /** Number of songs associated with the album. Unavailable in AlbumEntity. */
  songCount: number;
  /** Sum of the play count of all songs associated with the album. Unavailable in AlbumEntity. */
  playCount: number;
  /** Duration in seconds of all associated songs. Unavailable in AlbumEntity. */
  seconds: number;
  /** The date of the last song added to this album. Unavailable in AlbumEntity. */
  songAddDateMax: Date;
}
