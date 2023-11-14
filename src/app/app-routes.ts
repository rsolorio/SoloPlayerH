import { AppActionIcons, AppAttributeIcons, AppEntityIcons, AppViewIcons } from "./app-icons";

export interface IAppRouteInfo {
  route: AppRoute;
  icon: string;
  name: string;
  menuEnabled?: boolean;
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
  Classifications = '/classifications',
  Playlists = '/playlists',
  Filters = '/filters',
  FilterView = '/filters/view',
  Settings = '/settings',
  Log = '/log',
  Queries = '/queries',
  Files = '/filebrowser',
  SyncProfiles = '/syncprofiles'
}

export const appRoutes: { [route: string]: IAppRouteInfo; } = {};
appRoutes[AppRoute.Home] = { route: AppRoute.Home,
  icon: AppViewIcons.Home,
  name: 'Home',
  menuEnabled: true };
appRoutes[AppRoute.AlbumArtists] = { route: AppRoute.AlbumArtists,
  icon: AppEntityIcons.AlbumArtist,
  name: 'Album Artists',
  menuEnabled: true };
appRoutes[AppRoute.Artists] = { route: AppRoute.Artists,
  icon: AppEntityIcons.Artist,
  name: 'Artists',
  menuEnabled: true };
appRoutes[AppRoute.Albums] = { route: AppRoute.Albums,
  icon: AppEntityIcons.Album,
  name: 'Albums',
  menuEnabled: true };
appRoutes[AppRoute.Classifications] = { route: AppRoute.Classifications,
  icon: AppEntityIcons.Classification,
  name: 'Classifications',
  menuEnabled: true };
appRoutes[AppRoute.Songs] = { route: AppRoute.Songs,
  icon: AppEntityIcons.Song,
  name: 'Songs',
  menuEnabled: true };
appRoutes[AppRoute.Playlists] = { route: AppRoute.Playlists,
  icon: AppEntityIcons.Playlist,
  name: 'Playlists',
  menuEnabled: true };
appRoutes[AppRoute.Filters] = { route: AppRoute.Filters,
  icon: AppEntityIcons.Smartlist,
  name: 'Smartlists',
  menuEnabled: true };
appRoutes[AppRoute.Settings] = { route: AppRoute.Settings,
  icon: AppViewIcons.Settings,
  name: 'Settings',
  menuEnabled: true };
appRoutes[AppRoute.Log] = { route: AppRoute.Log,
  icon: AppViewIcons.Log,
  name: 'Event Log' };
appRoutes[AppRoute.Queries] = { route: AppRoute.Queries,
  icon: AppActionIcons.SearchData,
  name: 'Queries' };
appRoutes[AppRoute.Files] = { route: AppRoute.Files,
  icon: AppAttributeIcons.Directory,
  name: 'Files' };
appRoutes[AppRoute.SyncProfiles] = { route: AppRoute.SyncProfiles,
  icon: AppEntityIcons.Sync,
  name: 'Profiles' };