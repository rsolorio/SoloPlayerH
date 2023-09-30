import { ISideBarHostModel } from "src/app/core/components/side-bar-host/side-bar-host-model.interface";

export interface IInputEditorModel extends ISideBarHostModel {
  value: any;
  label: string;
  type: string;
}