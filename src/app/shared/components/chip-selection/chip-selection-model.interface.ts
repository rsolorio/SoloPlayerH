import { ISideBarHostModel } from "src/app/core/components/side-bar-host/side-bar-host-model.interface";
import { ISelectableValue } from "src/app/core/models/core.interface";

export interface IChipItem extends ISelectableValue {
  secondaryIcon?: string;
}
export interface IChipSelectionModel extends ISideBarHostModel {
  type: ChipSelectorType;
  items: IChipItem[];
  displayMode: ChipDisplayMode;
  onChipClick?: (selectionChanged: boolean, chipItem: IChipItem, model: IChipSelectionModel) => void;
  onOk?: (okResult: IChipSelectionModel) => void;
}

export enum ChipDisplayMode {
  /** Chips will be displayed as a flex layout. */
  Flex = 'flex',
  /** Every chip will be displayed as one line block. */
  Block = 'block'
}

export enum ChipSelectorType {
  /** Allows to select multiple values; the change takes effect as soon as the value is selected/unselected.  */
  Multiple,
  /** Allows to select multiple values; the change takes effect when the Ok button is clicked. */
  MultipleOk,
  /** Allows to select only one value; the change takes effect when the OK button is clicked. This mode does not allow to unselect. */
  SingleOk,
  /** Allows to select only one value between Yes and No; the value takes effect when the Ok button is clicked. This mode does not allow to unselect. */
  YesNo,
  /** Allows to select only one value; the change takes effect (and the panel will close) when the value is selected. */
  Quick
}