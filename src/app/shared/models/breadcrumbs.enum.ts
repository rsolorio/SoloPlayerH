export enum BreadcrumbSource {
  AlbumArtist,
  Artist,
  Album,
  Classification,
  Genre,
  Language,
  Decade,
  Mood
}

export enum BreadcrumbEventType {
  Add,
  Remove,
  Set,
  ReloadRequested
}

export enum BreadcrumbDisplayMode {
  /** Do not display the breadcrumbs. */
  None,
  /** Display icons if available. */
  Icon,
  /** Display captions if available. */
  Caption,
  /** Display icons and captions. */
  All
}