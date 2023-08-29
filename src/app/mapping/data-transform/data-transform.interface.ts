import { ISyncProfileParsed } from "src/app/shared/models/sync-profile-model.interface";

export interface IDataTransformService {
  init(profile: ISyncProfileParsed): Promise<void>;
  process(item: any): Promise<any>;
}