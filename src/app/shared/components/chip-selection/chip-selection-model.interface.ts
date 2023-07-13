import { ISelectableValue } from "src/app/core/models/core.interface";

export interface IChipSelectionModel {
  title?: string;
  subTitle?: string;
  type: ChipSelectorType;
  values: ISelectableValue[];
  displayMode: ChipDisplayMode;
  onCancel?: () => void;
  onOk: (values: ISelectableValue[]) => void;
}

export enum ChipDisplayMode {
  /** Chips will be displayed as a flex layout. */
  Flex = 'flex',
  /** Every chip will be displayed as one line block. */
  Block = 'block'
}

export enum ChipSelectorType {
  Multiple,
  Single,
  YesNo
}