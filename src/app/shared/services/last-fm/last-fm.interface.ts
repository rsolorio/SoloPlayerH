export interface ILastFmSession {
  name: string;
  key: string;
  subscriber: number;
}

export interface ILastFmSessionResponse {
  session: ILastFmSession;
}

export interface ILastFmScrobbleRequest {
  albumName: string;
  albumArtistName: string;
  artistName: string;
  trackTitle: string;
  mbId?: string;
}

export interface ILastFmScrobble {
  album: any;
  albumArtist: any;
  artist: any;
  ignoredMessage?: any;
  timestamp?: string;
  track: any;
}

export interface ILastFmScrobbles {
  scrobble: ILastFmScrobble;
  '@attr': ILastFmAttributes;
}

export interface ILastFmAttributes {
  /** Number of accepted scrobbles. */
  accepted?: number;
  /** Ignored message codes. 1: Artist ignored, 2: Track ignored, 3: Timestamp too old, 4: Timestamp too new, 5: Daily scrobble limit exceeded */
  code?: number;
  /** Number of ignored scrobbles. */
  ignored?: number;
  /** 1 if this track, artist or album name was automatically corrected, 0 otherwise. */
  corrected?: any;
}

export interface ILastFmScrobbleResponse {
  scrobbles: ILastFmScrobbles;
}

export interface ILastFmArtistResponse {
  artist: ILastFmArtist;
}
export interface ILastFmArtist {
  bio: ILastFmBio;
  image: ILastFmImage[];
  mbid: string;
  name: string;
  ontour: string;
  similar: ILastFmSimilarArtist;
  stats: ILastFmArtistStats;
  tags: any;
  url: string;
}

export interface ILastFmBio {
  content: string;
  links: ILastFmLinks;
  published: string;
  summary: any;
}

export interface ILastFmLinks {
  link: ILastFmLink;
}

export interface ILastFmLink {
  href: string;
  rel: string;
}

export interface ILastFmImage {
  '#text': string;
  size: string;
}

export interface ILastFmSimilarArtist {
  artist: ILastFmArtist[];
}

export interface ILastFmArtistStats {
  listeners: string;
  playcount: string;
  userplaycount: string;
}

export interface ILastFmRecentTracksResponse {
  recenttracks: ILastFmRecentTracks;
}

export interface ILastFmRecentTracks {
  '@attr': any;
  track: any[];
}