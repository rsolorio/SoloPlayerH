import { KeyValues } from "src/app/core/models/core.interface";
import { PlaylistSongEntity, SongEntity } from "../../entities";
import { IFileInfo } from "src/app/platform/file/file.interface";

export interface IScanInfo {
  fileCountProgress: number;
  items: IFileInfo[];
}

export interface ISyncSongInfo {
  songInitialCount: number;
  songFinalCount: number;
  songAddedRecords: SongEntity[];
  songUpdatedRecords: SongEntity[];
  songSkippedRecords: SongEntity[];
  songDeletedRecords: SongEntity[];
  metadataResults: KeyValues[];
}

export interface ISyncPlaylistInfo {
  trackCountProgress: number;
  items: PlaylistSongEntity[];
}