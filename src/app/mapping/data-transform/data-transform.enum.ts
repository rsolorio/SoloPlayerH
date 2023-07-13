export enum DataTransformId {
  MetadataReader = 'ef4c2f46-8803-4dc8-b937-2c8ffb150a62'
}

/**
 * Supported fields for the transform tasks.
 */
export enum MetaField {
  /** String. Id3v2, Id3v1 */
  Artist = 'artist',
  /** String. Id3v2 */
  ArtistSort = 'artistSort',
  /** String. Id3v2 */
  ArtistType = 'artistType',
  /** String. Id3v2 */
  ArtistStylized = 'artistStylized',
  /** String. PathExpression. */
  FeaturingArtist = 'featuring',
  /** String. Id3v2 */
  AlbumArtist = 'albumArtist',
  /** String. Id3v2 */
  AlbumArtistSort = 'albumArtistSort',
  /** String. Id3v2, Id3v1 */
  Album = 'album',
  /** String. Id3v2 */
  AlbumSort = 'albumSort',
  /** String. Id3v2 */
  AlbumType = 'albumType',
  /** String. None. */
  AlbumStylized = 'albumStylized',
  /** Number. Id3v2, Id3v1 */
  Year = 'year',
  /** String. Id3v2 */
  Country = 'country',
  /** String. Id3v2, Id3v1 */
  Genre = 'genre',
  /** String. Id3v2 */
  UfId = 'ufId',
  /** String. Id3v2, Id3v1 */
  Title = 'title',
  /** String. None. */
  SubTitle = 'subTitle',
  /** String. Id3v2 */
  TitleSort = 'titleSort',
  /** Number. Id3v2, Id3v1 */
  TrackNumber = 'track',
  /** Number. Id3v2 */
  MediaNumber = 'media',
  /** String. Id3v2 */
  Composer = 'composer',
  /** String. Id3v2, Id3v1 */
  Comment = 'comment',
  /** String. Id3v2 */
  Copyright = 'copyright',
  /** String. FileInfo */
  Contributor = 'contributor',
  /** String. FileInfo */
  Singer = 'singer',
  /** String. Id3v2 */
  Grouping = 'grouping',
  /** Date. Id3v2 */
  AddDate = 'addDate',
  /** Date. Id3v2 */
  ChangeDate = 'changeDate',
  /** String. Id3v2 */
  Language = 'language',
  /** String. Id3v2 */
  Mood = 'mood',
  /** Number. Id3v2 */
  Rating = 'rating',
  /** Number. Id3v2 */
  PlayCount = 'playCount',
  /** String. Id3v2 */
  Url = 'url',
  /** String. Id3v2 */
  SyncLyrics = 'syncLyrics',
  /** String. Id3v2 */
  UnSyncLyrics = 'unSyncLyrics',
  /** String. Id3v2 */
  Live = 'live',
  /** Not implemented yet. */
  Explicit = 'explicit',
  /** IImageSource. FileInfo, Id3v2 */
  ArtistImage = 'artistImage',
  /** IImageSource. FileInfo, Id3v2 */
  AlbumArtistImage = 'albumArtistImage',
  /** IImageSource. FileInfo, Id3v2 */
  AlbumImage = 'albumImage',
  /** IImageSource. FileInfo, Id3v2 */
  AlbumSecondaryImage = 'albumSecondaryImage',
  /** IImageSource. FileInfo, Id3v2 */
  SingleImage = 'singleImage',
  /** IImageSource. Id3v2 */
  OtherImage = 'otherImage',
  /** String. FileInfo */
  FilePath = 'filePath',
  /** String. FileInfo */
  FileName = 'fileName',
  /** Number. FileInfo */
  FileSize = 'fileSize',
  /** String; format: classificationType|classification1,classification2. Id3v2 */
  Classification = 'classification',
  /** Number. Id3v2 */
  Seconds = 'seconds',
  /** Number. Id3v2 */
  Bitrate = 'bitrate',
  /** Number. Id3v2 */
  Frequency = 'frequency',
  /** Boolean. Id3v2 */
  Vbr = 'vbr',
  /** Number. Id3v2 */
  ReplayGain = 'replayGain',
  /** Id3v2 */
  TagFullyParsed = 'tagFullyParsed',
  /** Id3v2 */
  Error = 'error',
  /** ScanFileMode. None. */
  FileMode = 'fileMode'
}