import { IListItemModel } from "src/app/shared/models/base-model.interface";
import { IFileInfo } from "../file/file.interface";

export interface IFileBrowserItem extends IListItemModel {
  fileInfo: IFileInfo;
}

export interface IFileBrowserModel {
  onOk: (values: IFileBrowserItem[]) => void;
  onCancel?: () => void;
}

export interface IFileBrowserQueryParams {
  path: string;
  name: string;
}