import { DataSourceEntity } from "src/app/shared/entities";

export interface IDataSource {
  get(propertyName: string): Promise<any[]>;
  load(info: ILoadInfo): Promise<ILoadInfo>;
}

export interface IDataSourceInfo {
  source: IDataSource;
  data: DataSourceEntity;
}

export interface ILoadInfo {
  filePath: string;
  config: string;
  error?: any;
  // TODO: continueOnError
}