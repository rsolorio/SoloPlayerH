import { DataMappingEntity, DataSourceEntity } from "src/app/shared/entities";

export interface IDataSourceService {
  get(propertyName: string, isDynamic?: boolean): Promise<any[]>;
  init(input: any, entity: IDataSourceParsed): Promise<IDataSourceParsed>;
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