export enum SongBadge {
  Kbps320 = '320 KBPS',
  Lyrics = 'LYRICS',
  Vbr = 'VBR',
  Live = 'LIVE',
  Favorite = 'FAVORITE',
  TopRated = 'TOP RATED',
  Explicit = 'EXPLICIT'
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