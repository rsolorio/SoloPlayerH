import { DataMappingEntity } from "src/app/shared/entities";
import { ISyncProfileParsed } from "src/app/shared/models/sync-profile-model.interface";

export interface IDataSourceService {
  get(propertyName: string): Promise<any[]>;
  init(input: any, entity: IDataSourceParsed, syncProfile?: ISyncProfileParsed): Promise<IDataSourceParsed>;
}

export interface IDataSourceParsed {
  id: string;
  type: string;
  config: any;
  fieldArray: string[];
  sequence: number;
  disabled: boolean;
  mappings?: DataMappingEntity[];
  service?: IDataSourceService;
  error?: any;
}