/**
 * Common music information for one or multiple songs.
 */
export interface IMusicInfoModel {
  count: number;
  genre: string;
  rating: number;
  ratingAverage: number;
  seconds: number;
  duration: string;
  size: number;
  sizeText: string;
  year: number;
  yearText: string;
}

export interface IMusicModel {
  musicInfo: IMusicInfoModel;
  favorite: boolean;
  imageSrc: string;
  canBeRendered: boolean;
}

export interface IMusicSearchTerms {
  artists: string[];
  albums: string[];
  titles: string[];
  wildcard: string;
}