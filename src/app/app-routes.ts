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
  QuickFilter = '/quickfilter'
}

export const appRoutes: { [route: string]: IAppRouteInfo; } = {};
appRoutes[AppRoute.Home] = { route: AppRoute.Home, name: 'Home', icon: 'mdi-home mdi'};
appRoutes[AppRoute.AlbumArtists] = { route: AppRoute.AlbumArtists, name: 'Album Artists', icon: 'mdi-account-badge mdi'};
appRoutes[AppRoute.Artists] = { route: AppRoute.Artists, name: 'Artists', icon: 'mdi-account-music mdi'};
appRoutes[AppRoute.Albums] = { route: AppRoute.Albums, name: 'Albums', icon: 'mdi-album mdi'};
appRoutes[AppRoute.Genres] = { route: AppRoute.Genres, name: 'Genres', icon: 'mdi-tag-outline mdi'};
appRoutes[AppRoute.Classifications] = { route: AppRoute.Classifications, name: 'Classifications', icon: 'mdi-tag-multiple-outline mdi'};
appRoutes[AppRoute.Songs] = { route: AppRoute.Songs, name: 'Songs', icon: 'mdi-music-note mdi'};
appRoutes[AppRoute.Playlists] = { route: AppRoute.Playlists, name: 'Playlists', icon: 'mdi-playlist-play mdi'};
appRoutes[AppRoute.Filters] = { route: AppRoute.Filters, name: 'Filters', icon: 'mdi-filter-variant mdi'};
appRoutes[AppRoute.Settings] = { route: AppRoute.Settings, name: 'Settings', icon: 'mdi-cogs mdi'};
appRoutes[AppRoute.Log] = { route: AppRoute.Log, name: 'Event Log', icon: 'mdi-file-document-edit-outline mdi'};
appRoutes[AppRoute.QuickFilter] = { route: AppRoute.QuickFilter, name: 'Quick Filter', icon: 'mdi-filter-outline mdi', menuHidden: true};