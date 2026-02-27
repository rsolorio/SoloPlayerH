export interface IMbSearchResponse {
    recordings?: IMbRecording[];
}

export interface IMbRecording {
    "artist-credit": IMbArtistCredit[];
    "artist-credit-id": string;
    "first-release-date": any;
    id: string;
    length: number;
    releases: IMbRelease[];
    score: number;
    title: string;
    video: any;
}

export interface IMbArtistCredit {
    artist: IMbArtist;
    name: string;
}

export interface IMbArtist {
    aliases: IMbArtistAlias[];
    id: string;
    name: string;
    "sort-name": string;
}

export interface IMbArtistAlias {
    "begin-date": any;
    "end-date": any;
    locale: any;
    name: string;
    primary: string;
    "sort-name": string;
    type: string;
    "type-id": string;
}

export interface IMbRelease {
    "artist-credit": IMbArtistCredit[];
    "artist-credit-id": string;
    count: number;
    date: any;
    id: string;
    media: any;
    "release-events": any;
    status: string;
    "status-id": string;
    title: string;
    "track-count": number;
}