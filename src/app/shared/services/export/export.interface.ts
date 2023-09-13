import { KeyValueGen } from "src/app/core/models/core.interface";
import { ISongExtendedModel } from "../../models/song-model.interface";
import { Criteria } from "../criteria/criteria.class";

export interface IExportConfig {
  profileId: string;
  directories?: string[];
  filterId?: string;
  playlistId?: string;
  criteria?: Criteria;
  songs?: ISongExtendedModel[];
  songExportEnabled?: boolean;
  playlistConfig?: IPlaylistExportConfig;
  flat?: boolean; // This is maybe part of the mapping?
}

export interface IPlaylistExportConfig {
  playlistsDisabled?: boolean;
  smartlistsDisabled?: boolean;
  autolistsDisabled?: boolean;
  playlistFormat?: string;
  playlistPrefix?: string;
  /** Name of the directory to place the playlists; */
  playlistDirectory?: string;
  fileMappings?: KeyValueGen<string>;
  playlistAbsolutePath?: boolean;
}