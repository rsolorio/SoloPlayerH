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
 * The value of each type represents the format: RelatedId(Song,Album,Artist)-Id-Type
 */
export enum PartyRelationType {
  /** The main artist of the song. */
  Primary = 'Artist-Song-Primary',
  /** The featuring artist of the song. */
  Featuring = 'Artist-Song-Featuring',
  /** The lead singer of the band. */
  Singer = 'Artist-Artist-Singer',
  /** The associated artist that contributes to another artist. */
  Contributor = 'Artist-Artist-Contributor',
  /** The composer of the song. */
  Composer = 'Artist-Song-Composer'
}