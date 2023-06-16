import { IFileInfo } from "src/app/platform/file/file.interface";

export interface IDataTransform {
  init(): Promise<void>;
  process(fileInfo: IFileInfo): Promise<any>;
}