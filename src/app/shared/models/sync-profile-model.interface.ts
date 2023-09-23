import { ValueListEntryEntity } from "../entities";

export interface ISyncProfileParsed {
  id: string;
  name: string;
  description: string;
  directories: string[];
  config: any;
  syncInfo: any;
  syncDate: Date;
  classifications?: ValueListEntryEntity[];
  nonPrimaryRelations?: any[];
}

export enum SyncType {
  Import = 'import',
  Export = 'export'
}