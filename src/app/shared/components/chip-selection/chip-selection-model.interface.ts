import { ISelectedDataItem } from "src/app/core/models/core.interface";

export interface IChipSelectionModel {
  title: string;
  values: ISelectedDataItem<string>[];
  /** If true, the selection mode will be single. */
  singleSelect?: boolean;
  onCancel?: () => void;
  onOk: (values: ISelectedDataItem<string>[]) => void;
}