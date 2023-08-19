import { IIconAction, IIconActionGeneric } from "src/app/core/models/core.interface";

export interface ISetting extends IIconActionGeneric<ISetting, any> {
  name: string;
  dataType: string;
  descriptions?: string[];
  descriptionsLargeSize?: string[];
  dynamicText?: string;
  warningText?: string;
  errorText?: string;
  disabled?: boolean;
  running?: boolean;
  secondaryIcon?: IIconAction;
}

export interface ISettingCategory {
  name: string;
  settings: ISetting[];
}
