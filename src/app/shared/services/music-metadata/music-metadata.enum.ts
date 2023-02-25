export enum MusicImageType {
  Artist = 'Artist',
  Single = 'Single',
  Front = 'Front',
  Back = 'Back',
  Other = 'Other'
}

/**
 * The picture type according to the ID3v2 APIC frame.
 * This enum emulates the music metadata library picture type:
 * https://github.com/Borewit/music-metadata/blob/master/lib/id3v2/ID3v2Token.ts
 */
export enum AttachedPictureType {
  Other = 'Other',
  Icon = "32x32 pixels 'file icon' (PNG only)",
  OtherIcon = 'Other file icon',
  Front = 'Cover (front)',
  Back = 'Cover (back)',
  Page = 'Leaflet page',
  Media = 'Media (e.g. label side of CD)',
  Lead = 'Lead artist/lead performer/soloist',
  Artist = 'Artist/performer',
  Conductor = 'Conductor',
  BandOrchestra = 'Band/Orchestra',
  Composer = 'Composer',
  Lyricist = 'Lyricist/text writer',
  RecordingLocation = 'Recording Location',
  DuringRecording = 'During recording',
  DuringPerformance = 'During performance',
  ScreenCapture = 'Movie/video screen capture',
  Fish = 'A bright coloured fish',
  Illustration = 'Illustration',
  ArtistLogo = 'Band/artist logotype',
  PublisherLogo = 'Publisher/Studio logotype'
}