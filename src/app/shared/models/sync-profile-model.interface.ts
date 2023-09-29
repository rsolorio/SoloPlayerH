import { ValueListEntryEntity } from "../entities";
import { IListItemModel } from "./base-model.interface";

export interface ISyncProfile extends IListItemModel {
  description: string;
  directories: string;
  config: string;
  syncType: string;
  syncDate: Date;
  syncInfo: string;
  defaultProfile: boolean;
  system: boolean;
  running?: boolean;
}

export interface ISyncProfileParsed extends ISyncProfile {
  directoryArray?: string[];
  configObj?: any;
  syncInfoObj?: any;
  classifications?: ValueListEntryEntity[];
  nonPrimaryRelations?: any[];
}

export enum SyncType {
  ImportAudio = 'importAudio',
  ImportPlaylists = 'importPlaylists',
  ExportAll = 'exportAll'
}