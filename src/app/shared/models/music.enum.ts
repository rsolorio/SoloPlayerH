export enum SongQuality {
  /** Low quality, bitrate < 320kbps && not VBR. */
  LQ = 'LQ',
  /** Variable bitrate < 320kbps. */
  VBR = 'VBR',
  /** Good quality, bitrate = 320kbps. */
  GQ = 'GQ',
  /** CD quality, bits = 16, Khz = 44.1. */
  CD = 'CD',
  /** High quality, bits > 16, Khz < 88.2. */
  HQ = 'HQ',
  /** High res, bits >= 24, Khz >= 88.2. */
  HR = 'HR'
}

export enum SongBadge {
  Kbps320 = '320 KBPS',
  Lyrics = 'LYRICS',
  Vbr = 'VBR',
  Live = 'LIVE',
  Favorite = 'FAVORITE',
  TopRated = 'TOP RATED',
  Explicit = 'EXPLICIT',
  Clean = 'CLEAN',
  LowQuality = 'LOW QUALITY',
  NotRated = 'NOT RATED',
  NoMood = 'NO MOOD'
}

/**
 * The relation types for the PartyRelation table.
 * The value of each type represents the format: RelatedId Data | PartyId Data
 */
export enum PartyRelationType {
  /** The main artist of the song. */
  Primary = 'primaryArtist|song',
  /** The featuring artist of the song. */
  Featuring = 'featuringArtist|song',
  /** The lead singer of the band. */
  Singer = 'singerArtist|bandArtist',
  /** The associated artist that contributes with another artist. */
  Contributor = 'contributorArtist|primaryArtist',
  /** The composer of the song. */
  Composer = 'composerArtist|song'
}

export enum MpegTagVersion {
  Id3v11 = 'Id3v1.1',
  Id3v23 = 'Id3v2.3',
  Id3v24 = 'Id3v2.4'
}

export enum FilterTarget {
  Artist = 'artist',
  Album = 'album',
  Song = 'song'
}