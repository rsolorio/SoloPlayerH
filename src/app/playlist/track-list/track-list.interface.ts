import { IMenuModel } from "src/app/core/models/menu-model.interface";
import { IPlaylistSongModel } from "src/app/shared/models/playlist-song-model.interface";

export interface ITrackListModel {
  items: IPlaylistSongModel[];
  itemMenuList: IMenuModel[];
  editEnabled?: boolean;
}