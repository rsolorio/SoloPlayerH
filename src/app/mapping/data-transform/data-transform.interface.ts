import { KeyValues } from "src/app/core/models/core.interface";
import { ISyncProfileParsed } from "src/app/shared/models/sync-profile-model.interface";
import { IDataSourceParsed } from "../data-source/data-source.interface";

export interface IDataTransformService {
  init(profile: ISyncProfileParsed, inputSources: IDataSourceParsed[]): Promise<void>;
  run(item: any): Promise<any>;
}

export interface IMetadataWriterOutput {
  sourcePath: string;
  destinationPath: string;
  metadata: KeyValues;
  count?: number;
  skipped?: boolean;
  error?: any;
}