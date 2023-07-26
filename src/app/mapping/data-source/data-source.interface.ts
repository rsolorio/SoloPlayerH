import { DataMappingEntity, DataSourceEntity } from "src/app/shared/entities";

export interface IDataSource {
  get(propertyName: string, isDynamic?: boolean): Promise<any[]>;
  load(info: ILoadInfo): Promise<ILoadInfo>;
}

export interface IDataSourceInfo {
  source: IDataSource;
  data: DataSourceEntity;
  mappings?: DataMappingEntity[];
  fieldArray: string[];
  dynamicFieldArray?: string[];
}

export interface ILoadInfo {
  filePath: string;
  config: string;
  fieldArray: string[];
  error?: any;
  // TODO: continueOnError
}