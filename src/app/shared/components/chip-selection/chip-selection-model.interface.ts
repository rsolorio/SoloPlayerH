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
  /** Allows to select multiple values and then click Ok to confirm. */
  Multiple,
  /** Allows to select only one value and then click Ok to confirm. This mode does not allow to unselect. */
  Single,
  /** Allows to select only one value between Yes and No and then click Ok to confirm. This mode does not allow to unselect. */
  YesNo,
  /** Allows to select only one value without clicking Ok; the panel will close as soon as the value is selected. */
  Quick
}