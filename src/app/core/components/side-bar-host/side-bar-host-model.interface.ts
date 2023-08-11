import { Type } from "@angular/core";
import { IIconAction } from "../../models/core.interface";

export interface ISideBarHostModel {
  componentType: Type<any>;
  title?: string;
  subTitle?: string;
  titleIcon?: string;
  subTitleIcon?: string;
  okHidden?: boolean;
  actions?: IIconAction[];
  /** Number of milliseconds to delay the ok action. */
  okDelay?: number;
  onCancel?: () => void;
  onOk?: (okResult: ISideBarHostModel) => void;
}