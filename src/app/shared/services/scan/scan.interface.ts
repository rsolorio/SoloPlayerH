import { KeyValues } from "src/app/core/models/core.interface";
import { SongEntity } from "../../entities";

export interface IScanItemInfo<TItem> {
  progress: number;
  item: TItem;
  total?: number;
  scanId?: string;
}

export interface ISyncSongInfo {
  songInitialCount: number;
  songFinalCount: number;
  songAddedRecords: SongEntity[];
  songUpdatedRecords: SongEntity[];
  songSkippedRecords: SongEntity[];
  songDeletedRecords: SongEntity[];
  ignoredFiles: string[];
  metadataResults: KeyValues[];
}