export interface ISetting {
  name: string;
  dataType: string;
  descriptions: string[];
  dynamicText?: string;
  warningText?: string;
  errorText?: string;
  disabled?: boolean;
  icon?: string;
  running?: boolean;
  action?: (setting: ISetting) => void;
}

export interface ISettingCategory {
  name: string;
  settings: ISetting[];
}
