import { KeyValues } from "src/app/core/models/core.interface";
import { SongEntity } from "../../entities";

export interface ISyncInfo {
  songInitialCount: number;
  songFinalCount: number;
  songAddedRecords: SongEntity[];
  songUpdatedRecords: SongEntity[];
  songSkippedRecords: SongEntity[];
  songDeletedRecords: SongEntity[];
  metadataResults: KeyValues[];
}