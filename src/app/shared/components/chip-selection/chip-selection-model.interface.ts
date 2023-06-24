import { ISelectableValue } from "src/app/core/models/core.interface";
import { ICriteriaValueSelector } from "../../services/criteria/criteria.interface";

export interface IChipSelectionModel {
  title?: string;
  selector: ICriteriaValueSelector;
  /** If true, every chip will be displayed as a one line block. */
  displayMode: ChipDisplayMode;
  onCancel?: () => void;
  onOk: (values: ISelectableValue[]) => void;
}

export enum ChipDisplayMode {
  Flex = 'flex',
  Block = 'block'
}