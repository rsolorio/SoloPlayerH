import { ISideBarHostModel } from "src/app/core/components/side-bar-host/side-bar-host-model.interface";
import { IIconActionGeneric } from "src/app/core/models/core.interface";

export interface ISetting extends IIconActionGeneric<ISetting, any> {
  /** Name of the setting displayed as header. */
  name: string;
  /** If this is an editable setting, the data type specifies how this data can be edited.*/
  editorType?: string;
  /** A list of texts that describe the setting. It supports HTML format. */
  textHtml?: string;
  /** A list of texts that describe the setting. It supports regular text, not HTML. */
  textRegular?: string[];
  /** The human readable data to be displayed. */
  textData?: string[];
  /** A text with warning color, HTML not supported. */
  textWarning?: string;
  /** A text with error color, HTML not supported. */
  textError?: string;
  /** If the setting should be displayed as disabled. */
  disabled?: boolean;
  /** If true this will display a running animation. */
  running?: boolean;
  /** The actual data to be bound to the setting. */
  data?: any;
  /** Event to be fired if the data changed. */
  onChange?: (setting: ISetting) => void;
  /** Event to be fired before opening a panel. */
  beforePanelOpen?: (panelMode: ISideBarHostModel) => Promise<void>;
}

export interface ISettingCategory {
  name: string;
  settings: ISetting[];
}

export function clearSettingText(setting: ISetting): void {
  setting.textHtml = null;
  setting.textRegular = [];
  setting.textData = [];
  setting.textWarning = null;
  setting.textError = null;
}
