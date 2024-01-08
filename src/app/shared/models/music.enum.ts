export enum SongBadge {
  Kbps320 = '320 KBPS',
  Lyrics = 'LYRICS',
  Vbr = 'VBR',
  Live = 'LIVE',
  Favorite = 'FAVORITE',
  TopRated = 'TOP RATED',
  Explicit = 'EXPLICIT',
  LowQuality = 'LOW QUALITY',
  NotRated = 'NOT RATED'
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