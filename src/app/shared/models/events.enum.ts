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
  // Player
  PlayerPositionChanged = 'PLAYER_POSITION_CHANGED',
  PlayerStatusChanged = 'PLAYER_STATUS_CHANGED',
  PlaylistCurrentTrackChanged = 'PLAYLIST_CURRENT_TRACK_CHANGED',
  FullPlayerPaletteLoaded = 'FULL_PLAYER_PALETTE_LOADED',
  // Breadcrumb
  MusicBreadcrumbUpdated = 'MUSIC_BREADCRUMB_UPDATED',
  // Scan
  ScanFile = 'SCAN_FILE'
}
