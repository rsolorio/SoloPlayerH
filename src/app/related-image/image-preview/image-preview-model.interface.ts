import { ISideBarHostModel } from "src/app/core/components/side-bar-host/side-bar-host-model.interface";

export interface IImagePreviewModel extends ISideBarHostModel {
  src: string;
  shareDisabled?: boolean;
  downloadDisabled?: boolean;
}