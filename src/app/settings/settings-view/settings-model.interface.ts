export interface ISetting {
  name: string;
  dataType: string;
  descriptions: string[];
  dynamicText?: string;
  disabled?: boolean;
  action?: (setting: ISetting) => void;
}

export interface ISettingCategory {
  name: string;
  settings: ISetting[];
}
