import { ISideBarHostModel } from "src/app/core/components/side-bar-host/side-bar-host-model.interface";
import { ISongModel } from "src/app/shared/models/song-model.interface";

export interface IAddToPlaylistModel extends ISideBarHostModel {
  songs?: ISongModel[];
}