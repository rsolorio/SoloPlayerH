export enum EventType {
  // Core
  WindowSizeChanged = 'WINDOW_SIZE_CHANGED',
  BreakpointExtended = 'BREAKPOINT_EXTENDED',
  BreakpointReduced = 'BREAKPOINT_REDUCED',
  BreakpointChanged = 'BREAKPOINT_CHANGED',
  WindowScrollDown = 'WINDOW_SCROLL_DOWN',
  WindowScrollUp = 'WINDOW_SCROLL_UP',
  WindowClick = 'WINDOW_CLICK',
  RouteChanging = 'ROUTE_CHANGING',
  RouteChanged = 'ROUTE_CHANGED',
  // PWA
  PwaInstallAvailable = 'PWA_INSTALL_AVAILABLE',
  PwaUpdateAvailable = 'PWA_UPDATE_AVAILABLE',
  // App
  SearchSelectionDone = 'SEARCH_SELECTION_DONE',
  SongListUpdated = 'SONG_LIST_UPDATED',
  AlbumListUpdated = 'ALBUM_LIST_UPDATED',
  ArtistListUpdated = 'ARTIST_LIST_UPDATED',
  PlaylistListUpdated = 'PLAYLIST_LIST_UPDATED',
  FilterListUpdated = 'FILTER_LIST_UPDATED',
  // Player
  PlayerPositionChanged = 'PLAYER_POSITION_CHANGED',
  PlayerStatusChanged = 'PLAYER_STATUS_CHANGED',
  PlaylistCurrentTrackChanged = 'PLAYLIST_CURRENT_TRACK_CHANGED',
  FullPlayerPaletteLoaded = 'FULL_PLAYER_PALETTE_LOADED',
  // Breadcrumb
  BreadcrumbAdded = 'BREADCRUMB_ADDED'
}
