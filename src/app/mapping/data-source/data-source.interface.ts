import { DataMappingEntity } from "src/app/shared/entities";
import { ISyncProfileParsed } from "src/app/shared/models/sync-profile-model.interface";

export interface IDataSourceService {
  init(): void;
  hasData(): boolean;
  getData(attributeName: string): Promise<any[]>;
  setSource(input: any, entity: IDataSourceParsed, syncProfile?: ISyncProfileParsed): Promise<IDataSourceParsed>;
}

export interface IDataSourceParsed {
  id: string;
  type: string;
  config: any;
  /**
   * This list specifies which attributes will be populated in the metadata object to be returned.
   * By default, data sources know how to get the value of an attribute, but that can change using a mapping,
   * which tells the process to get the value differently.
   */
  attributeArray: string[];
  sequence: number;
  disabled: boolean;
  /**
   * This is the list of mappings associated to the data source;
   * if you add a mapping for a field that is not in the field list, the mapping will be ignored,
   * unless it is a user defined mapping.
   */
  mappings?: DataMappingEntity[];
  service?: IDataSourceService;
  error?: any;
}