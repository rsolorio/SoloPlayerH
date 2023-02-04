import { ISelectableValue } from "src/app/core/models/core.interface";

export interface IChipSelectionModel {
  title: string;
  values: ISelectableValue[];
  /** If true, the selection mode will be single. */
  singleSelect?: boolean;
  onCancel?: () => void;
  onOk: (values: ISelectableValue[]) => void;
}