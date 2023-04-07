export enum AppEvent {
  // App
  QuickSearchFired = 'QUICK_SEARCH_FIRED',
  SearchSelectionDone = 'SEARCH_SELECTION_DONE',
  SongListUpdated = 'SONG_LIST_UPDATED',
  AlbumListUpdated = 'ALBUM_LIST_UPDATED',
  ArtistListUpdated = 'ARTIST_LIST_UPDATED',
  ClassificationListUpdated = 'CLASSIFICATION_LIST_UPDATED',
  PlaylistListUpdated = 'PLAYLIST_LIST_UPDATED',
  FilterListUpdated = 'FILTER_LIST_UPDATED',
  FileListUpdated = 'FILE_LIST_UPDATED',
  CriteriaApplied = 'CRITERIA_APPLIED',
  CriteriaCleared = 'CRITERIA_CLEARED',
  // Player
  PlayerPositionChanged = 'PLAYER_POSITION_CHANGED',
  PlayerStatusChanged = 'PLAYER_STATUS_CHANGED',
  PlaylistCurrentTrackChanged = 'PLAYLIST_CURRENT_TRACK_CHANGED',
  FullPlayerPaletteLoaded = 'FULL_PLAYER_PALETTE_LOADED',
  // Breadcrumb
  BreadcrumbUpdated = 'BREADCRUMB_UPDATED',
  // Scan
  ScanFile = 'SCAN_FILE',
  ScanPlaylistCreated = 'SCAN_PLAYLIST_CREATED',
  ScanTrackAdded = 'SCAN_TRACK_ADDED',
  // DB
  DbInitialized = 'DB_INITIALIZED'
}
