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

export interface IMusicSearchTerms {
  /** Artist names to search for. */
  artists: string[];
  /** Album names to search for. */
  albums: string[];
  /** Titles to search for. */
  titles: string[];
  /** A term that will be used to search for artists, albums or titles. */
  wildcard: string;
}