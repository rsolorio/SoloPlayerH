import { IListItemModel } from "src/app/shared/models/base-model.interface";
import { IFileInfo } from "../file/file.interface";

export interface IFileBrowserItem extends IListItemModel {
  fileInfo?: IFileInfo;
}

export interface IFileBrowserModel {
  selectedItems?: IFileBrowserItem[];
  onOk: (model: IFileBrowserModel) => Promise<boolean>;
  backRoute: string;
  onCancel?: () => Promise<boolean>;
}

export interface IFileBrowserQueryParams {
  path: string;
  name: string;
}