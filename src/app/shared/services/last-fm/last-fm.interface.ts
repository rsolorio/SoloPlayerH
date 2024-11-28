export interface ILastFmSession {
  name: string;
  key: string;
  subscriber: number;
}

export interface ILastFmSessionResponse {
  session: ILastFmSession;
}

export interface ILastFmScrobble {
  album: any;
  albumArtist: any;
  artist: any;
  ignoredMessage: any;
  timestamp: string;
  track: any;
}

export interface ILastFmScrobbles {
  scrobble: ILastFmScrobble;
  '@attr': any;
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