import { ITimePeriod, KeyValueGen } from "src/app/core/models/core.interface";
import { ISongExtendedModel } from "../../models/song-model.interface";
import { Criteria } from "../criteria/criteria.class";

export interface IExportConfig {
  directories?: string[];
  lastAddedCount?: number;
  filterId?: string;
  playlistId?: string;
  criteria?: Criteria;
  songs?: ISongExtendedModel[];
  songExportEnabled?: boolean;
  playlistConfig?: IPlaylistExportConfig;
}

export interface IPlaylistExportConfig {
  /** If playlist entities should be exported as playlist files. */
  playlistsDisabled?: boolean;
  /** If filter entities should be exported as playlist files. */
  smartlistsDisabled?: boolean;
  /** If auto playlists should run to generate playlist files. */
  autolistsDisabled?: boolean;
  /** The playlist format (the file extension) */
  format?: string;
  /** A text to be prepended to the name of the playlist. */
  prefix?: string;
  /** The separator between the prefix and the name of the playlist, if any. */
  nameSeparator?: string;
  /** Name of the directory to place the playlists. */
  directory?: string;
  /** Full directory path where playlist will be stored. */
  path?: string;
  /** A list of key/value items that identify the original and the new file path of a song. */
  fileMappings?: KeyValueGen<string>;
  /** If an absolute path should be used as reference in the playlist file; if off, it will use a relative path. */
  absolutePathEnabled?: boolean;
  /** The minimum number of tracks to create a playlist. */
  minCount?: number;
  /** The maximum number of tracks to include in a playlist. */
  maxCount?: number;
}

export interface IExportResult {
  directoryPath: string;
  directoryName: string;
  totalFileCount: number;
  finalFileCount: number;
  smartlistCount: number;
  autolistCount: number;
  playlistCount: number;
  period?: ITimePeriod;
}