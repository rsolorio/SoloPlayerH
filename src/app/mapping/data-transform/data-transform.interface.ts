import { IFileInfo } from "src/app/platform/file/file.interface";

export interface IDataTransform {
  init(config?: IDataTransformConfig): Promise<void>;
  process(fileInfo: IFileInfo): Promise<any>;
}

export interface IDataTransformConfig {
  dynamicFields?: string[];
}