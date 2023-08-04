import { Type } from "@angular/core";

export interface ISideBarHostModel {
  componentType: Type<any>;
  title?: string;
  subTitle?: string;
  titleIcon?: string;
  subTitleIcon?: string;
  okHidden?: boolean;
  onCancel?: () => void;
  onOk?: (okResult: ISideBarHostModel) => void;
}