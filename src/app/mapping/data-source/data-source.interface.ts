import { DataSourceEntity } from "src/app/shared/entities";

export interface IDataSource {
  get(propertyName: string): any[];
  load(info: ILoadInfo): Promise<void>;
}

export interface IDataSourceInfo {
  source: IDataSource;
  data: DataSourceEntity;
}

export interface ILoadInfo {
  filePath: string;
  config: string;
}