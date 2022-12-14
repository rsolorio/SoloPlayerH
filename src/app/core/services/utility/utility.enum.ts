export enum BreakpointMode {
  Small = 'small',
  Large = 'large'
}

/** Contains the number of milliseconds on each time unit. */
export enum Milliseconds {
  Millisecond = 1,
  Second = 1000,
  Minute = 1000 * 60,
  Hour = 1000 * 60 * 60,
  Day = 1000 * 60 * 60 * 24
}

export enum AppRoutes {
  Empty = '/',
  Home = '/home',
  Favorites = '/favorites',
  Search = '/search',
  Songs = '/songs',
  Artists = '/artists',
  AlbumArtists = '/albumartists',
  Albums = '/albums',
  Genres = '/genres',
  Classifications = '/classifications',
  Playlists = '/playlists',
  Filters = '/filters',
  FilterView = '/filters/view',
  Settings = '/settings',
  Log = '/log'
}
