import { IIconActionGeneric } from "src/app/core/models/core.interface";

export interface ISetting extends IIconActionGeneric<ISetting, any> {
  /** Name of the setting displayed as header. */
  name: string;
  /** If this is an editable setting, the data type specifies how this data can be edited.*/
  editorType?: string;
  /** A list of texts supporting HTML format and with a medium size font. */
  descriptions?: string[];
  /** A list of texts supporting HTML format and with a large size font. */
  descriptionsLargeSize?: string[];
  /** A text with a medium size font, HTML not supported. */
  dynamicText?: string;
  /** A text with a medium size font and warning color, HTML not supported. */
  warningText?: string;
  /** A text with a medium size font and error color, HTML not supported. */
  errorText?: string;
  /** If the setting should be displayed as disabled. */
  disabled?: boolean;
  /** If true this will displaying a running animation. */
  running?: boolean;
  /** Data to be bound to the setting. */
  data?: any;
  /** Event to be fired if the data changed. */
  onChange?: (setting: ISetting) => void;
}

export interface ISettingCategory {
  name: string;
  settings: ISetting[];
}
