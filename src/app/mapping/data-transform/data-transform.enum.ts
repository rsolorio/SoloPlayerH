/**
 * Supported fields for the transform tasks.
 */
export enum OutputField {
  /** Id3v2 */
  Artist = 'artist',
  /** Id3v2 */
  ArtistSort = 'artistSort',
  /** Id3v2 */
  ArtistType = 'artistType',
  /** Id3v2 */
  ArtistStylized = 'artistStylized',
  /** Id3v2 */
  AlbumArtist = 'albumArtist',
  /** Id3v2 */
  AlbumArtistSort = 'albumArtistSort',
  /** Id3v2 */
  Album = 'album',
  /** Id3v2 */
  AlbumSort = 'albumSort',
  /** Id3v2 */
  AlbumType = 'albumType',
  /** Id3v2 */
  Year = 'year',
  /** Id3v2 */
  Country = 'country',
  /** Id3v2 */
  Genre = 'genre',
  /** Id3v2 */
  UfId = 'ufId',
  /** Id3v2 */
  Title = 'title',
  /** Id3v2 */
  TitleSort = 'titleSort',
  /** Id3v2 */
  TrackNumber = 'trackNumber',
  /** Id3v2 */
  MediaNumber = 'mediaNumber',
  /** Id3v2 */
  Composer = 'composer',
  /** Id3v2 */
  Comment = 'comment',
  /** Id3v2 */
  Grouping = 'grouping',
  /** Id3v2 */
  AddDate = 'addDate',
  /** Id3v2 */
  ChangeDate = 'changeDate',
  /** Id3v2 */
  Language = 'language',
  /** Id3v2 */
  Mood = 'mood',
  /** Id3v2 */
  Rating = 'rating',
  /** Id3v2 */
  PlayCount = 'playCount',
  /** Id3v2 */
  SyncLyrics = 'syncLyrics',
  /** Id3v2 */
  UnSyncLyrics = 'unSyncLyrics',
  /** Id3v2 */
  Live = 'live',
  Explicit = 'explicit',
  /** FileInfo, Id3v2 */
  ArtistImage = 'artistImage',
  /** FileInfo, Id3v2 */
  AlbumArtistImage = 'albumArtistImage',
  /** FileInfo, Id3v2 */
  AlbumImage = 'albumImage',
  /** FileInfo, Id3v2 */
  AlbumSecondaryImage = 'albumSecondaryImage',
  /** FileInfo, Id3v2 */
  SingleImage = 'singleImage',
  /** Id3v2 */
  OtherImage = 'otherImage',
  /** FileInfo */
  FilePath = 'filePath',
  /** FileInfo */
  FileName = 'fileName',
  /** FileInfo */
  FileSize = 'fileSize',
  /** Id3v2 */
  Classification = 'classification'
}