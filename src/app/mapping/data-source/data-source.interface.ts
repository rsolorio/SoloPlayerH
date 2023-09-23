import { DataMappingEntity } from "src/app/shared/entities";
import { ISyncProfileParsed } from "src/app/shared/models/sync-profile-model.interface";

export interface IDataSourceService {
  init(): void;
  hasData(): boolean;
  getData(propertyName: string): Promise<any[]>;
  setSource(input: any, entity: IDataSourceParsed, syncProfile?: ISyncProfileParsed): Promise<IDataSourceParsed>;
}

export interface IDataSourceParsed {
  id: string;
  type: string;
  config: any;
  /**
   * This list of fields specifies which properties will be populated in the metadata object to be returned.
   * By default, data sources know how to get the value of a property, but that can change using a mapping,
   * which tells the process to get the value differently.
   * If you add a mapping for a field that is not in this list, the mapping will be ignored.
   */
  fieldArray: string[];
  sequence: number;
  disabled: boolean;
  mappings?: DataMappingEntity[];
  service?: IDataSourceService;
  error?: any;
}