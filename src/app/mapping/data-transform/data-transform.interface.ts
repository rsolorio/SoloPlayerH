import { KeyValues } from "src/app/core/models/core.interface";
import { ISyncProfileParsed } from "src/app/shared/models/sync-profile-model.interface";

export interface IDataTransformService {
  init(profile: ISyncProfileParsed): Promise<void>;
  process(item: any): Promise<any>;
}

export interface IMetadataWriterOutput {
  sourcePath: string;
  destinationPath: string;
  metadata: KeyValues;
  error?: any;
}