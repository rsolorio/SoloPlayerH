/*
Fields to support

Key   Name                    Supported  Multiple  Version
TIT2  Title                   Yes
TSOT  Title Sort              Yes                  v2.4
TPE1  Artist/Performer        Yes        Yes
TSOP  Artist/Performer Sort   Yes        Yes       v2.4
TPE2  Album Artist            Yes
TSO2  Album Artist Sort       No
TALB  Album                   Yes
TSOA  Album Sort              Yes        No        v2.4
TCON  Genre                   Yes        Yes
TRCK  Track                   Yes
TPOS  Media Number            Yes
COMM  Comment                 Yes
TCOM  Composer                Yes
TSOC  Composer Sort           No         No        v2.4
TIT1  Grouping                Yes
UFID  Unique Identifier       Yes
PCNT  Play Count              No
POPM  Popularimeter           Yes
APIC  Picture                 Yes
TLAN  Language                Yes
TMOO  Mood                    Yes
TMED  Media Type              Yes
TLEN  Media Length            Yes
TOWN  Owner                   Yes
TIT3  Subtitle                Yes
USLT  Unsync Lyrics           Yes
SYLT  Sync Lyrics             Yes
TYER  Recording Year          Yes       No         v2.3
TDAT  Recording Date          Yes       No         v2.3
TIME  Recording Time          Yes       No         v2.3
TDRL  Release Date            Yes       No         v2.4
TDRC  Recording Date          Yes       No         v2.4
TBPM  Tempo                   Yes
TXXX  User Defined            Yes
PRIV  Private                 Yes

*/

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
  /** String. Id3v2 */
  MusicBrainzAlbumType = 'MusicBrainz Album Type',
  /** String. None. */
  AlbumStylized = 'albumStylized',
  /** Number. Id3v2, Id3v1 */
  Year = 'year',
  /** String. Id3v2 */
  Country = 'country',
  /** String. Id3v2, Id3v1 */
  Genre = 'genre',
  /** String. Id3v2 */
  Subgenre = 'subgenre',
  /** String. Id3v2 */
  Occasion = 'occasion',
  /** String. Id3v2 */
  Instrument = 'instrument',
  /** String. Id3v2 */
  Category = 'category',
  /** String. Id3v2 */
  UfId = 'ufId',
  /** String. Id3v2, Id3v1 */
  Title = 'title',
  /** String. */
  CleanTitle = 'cleanTitle',
  /** String. None. */
  Subtitle = 'subtitle',
  /** String. Id3v2 */
  TitleSort = 'titleSort',
  /** Number. Id3v2, Id3v1 */
  TrackNumber = 'track',
  /** Number. Id3v2 */
  MediaNumber = 'media',
  /** String. Id3v2 */
  MediaType = 'mediaType',
  /** String. Id3v2 */
  Composer = 'composer',
  /** String. Id3v2 */
  ComposerSort = 'composerSort',
  /** String. Id3v2, Id3v1 */
  Comment = 'comment',
  /** String. Id3v2 */
  Copyright = 'copyright',
  /** String. Id3v2 */
  Publisher = 'publisher',
  /** String. Id3v2 */
  OriginalArtist = 'originalArtist',
  /** String. Id3v2 */
  OriginalAlbum = 'originalAlbum',
  /** Number. Id3v2 */
  OriginalReleaseYear = 'originalReleaseYear',
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
  /** Date. Id3v2 */
  PlayDate = 'playDate',
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
  VideoUrl = 'videoUrl',
  /** String. Id3v2 */
  SyncLyrics = 'syncLyrics',
  /** String. Id3v2 */
  UnSyncLyrics = 'unSyncLyrics',
  /** Boolean. Id3v2 */
  Live = 'live',
  /** Boolean. Id3v2. */
  Favorite = 'favorite',
  /** Boolean. Id3v2. */
  Explicit = 'explicit',
  /** Number. Id3v2. */
  PerformerCount = 'performerCount',
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
  /** String. FileInfo */
  FileExtension = 'fileExtension',
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
  Tempo = 'tempo',
  /** Number. Id3v2 */
  ReplayGain = 'replayGain',
  /** Boolean. Id3v2 */
  TagFullyParsed = 'tagFullyParsed',
  /** String. Id3v2 */
  Owner = 'owner',
  /** String. */
  PlayHistory = 'playHistory',
  /** String. */
  UserDefinedField = 'userDefinedField',
  /** String. Id3v2. Scan. */
  Error = 'error',
  /** Boolean. Scan. */
  Ignored = 'ignored',
  /** ScanFileMode. None. */
  FileMode = 'fileMode'
  /**  */
}