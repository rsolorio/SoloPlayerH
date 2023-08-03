export interface IAppRouteInfo {
  route: AppRoute;
  icon: string;
  name: string;
  menuHidden?: boolean;
}

export enum AppRoute {
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
  Log = '/log',
  Queries = '/queries',
  Files = '/filebrowser'
}

export const appRoutes: { [route: string]: IAppRouteInfo; } = {};
appRoutes[AppRoute.Home] = { route: AppRoute.Home,
  icon: 'mdi-home mdi',
  name: 'Home' };
appRoutes[AppRoute.AlbumArtists] = { route: AppRoute.AlbumArtists,
  icon: 'mdi-account-badge mdi',
  name: 'Album Artists' };
appRoutes[AppRoute.Artists] = { route: AppRoute.Artists,
  icon: 'mdi-account-music mdi',
  name: 'Artists' };
appRoutes[AppRoute.Albums] = { route: AppRoute.Albums,
  icon: 'mdi-album mdi',
  name: 'Albums' };
appRoutes[AppRoute.Genres] = { route: AppRoute.Genres,
  icon: 'mdi-tag-outline mdi',
  name: 'Genres' };
appRoutes[AppRoute.Classifications] = { route: AppRoute.Classifications,
  icon: 'mdi-sitemap-outline mdi',
  name: 'Classifications' };
appRoutes[AppRoute.Songs] = { route: AppRoute.Songs,
  icon: 'mdi-music-note mdi',
  name: 'Songs' };
appRoutes[AppRoute.Playlists] = { route: AppRoute.Playlists,
  icon: 'mdi-playlist-play mdi',
  name: 'Playlists' };
appRoutes[AppRoute.Filters] = { route: AppRoute.Filters,
  icon: 'mdi-filter-variant mdi',
  name: 'Filters' };
appRoutes[AppRoute.Settings] = { route: AppRoute.Settings,
  icon: 'mdi-cogs mdi',
  name: 'Settings' };
appRoutes[AppRoute.Log] = { route: AppRoute.Log,
  icon: 'mdi-file-document-edit-outline mdi',
  name: 'Event Log' };
appRoutes[AppRoute.Queries] = { route: AppRoute.Queries,
  icon: 'mdi-filter-outline mdi',
  name: 'Queries',
  menuHidden: true };
appRoutes[AppRoute.Files] = { route: AppRoute.Files,
  icon: 'mdi-folder-outline mdi',
  name: 'Files',
  menuHidden: true };