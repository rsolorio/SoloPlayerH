export enum CoreEvent {
  WindowSizeChanged = 'WINDOW_SIZE_CHANGED',
  BreakpointExtended = 'BREAKPOINT_EXTENDED',
  BreakpointReduced = 'BREAKPOINT_REDUCED',
  BreakpointChanged = 'BREAKPOINT_CHANGED',
  WindowScrollDown = 'WINDOW_SCROLL_DOWN',
  WindowScrollUp = 'WINDOW_SCROLL_UP',
  WindowClick = 'WINDOW_CLICK',
  RouteChanging = 'ROUTE_CHANGING',
  RouteChanged = 'ROUTE_CHANGED',
  SidebarMenuAction = 'SIDEBAR_MENU_ACTION',
  SidebarShow = 'SIDEBAR_SHOW',
  NavbarBackRequested = 'NAVBAR_BACK_REQUESTED'
}

export enum AppEvent {
  // App
  QuickSearchFired = 'QUICK_SEARCH_FIRED',
  SongListUpdated = 'SONG_LIST_UPDATED',
  AlbumListUpdated = 'ALBUM_LIST_UPDATED',
  ArtistListUpdated = 'ARTIST_LIST_UPDATED',
  ClassificationListUpdated = 'CLASSIFICATION_LIST_UPDATED',
  PlaylistListUpdated = 'PLAYLIST_LIST_UPDATED',
  FilterListUpdated = 'FILTER_LIST_UPDATED',
  FileListUpdated = 'FILE_LIST_UPDATED',
  SyncProfileListUpdated = 'SYNC_PROFILE_LIST_UPDATED',
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
  ScanAudioFileStart = 'SCAN_AUDIO_FILE_START',
  ScanAudioDbSyncStart = 'SCAN_AUDIO_DB_SYNC_START',
  ScanAudioDbCleanupStart = 'SCAN_AUDIO_DB_CLEANUP_START',
  ScanAudioEnd = 'SCAN_AUDIO_END',
  ScanPlaylistCreated = 'SCAN_PLAYLIST_CREATED',
  ScanTrackAdded = 'SCAN_TRACK_ADDED',
  ScanPlaylistEnd = 'SCAN_PLAYLIST_END',
  // Export
  ExportStart = 'EXPORT_START',
  ExportAudioFileStart = 'EXPORT_AUDIO_FILE_START',
  ExportAudioFileEnd = 'EXPORT_AUDIO_FILE_END',
  ExportSmartlistsStart = 'EXPORT_SMART_LISTS_START',
  ExportAutolistsStart = 'EXPORT_AUTO_LISTS_START',
  ExportPlaylistsStart = 'EXPORT_PLAY_LISTS_START',
  ExportEnd = 'EXPORT_END',
  // DB
  DbInitialized = 'DB_INITIALIZED'
}
