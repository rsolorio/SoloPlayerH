import { IValueModel } from "src/app/core/models/core.interface";

export interface IRatingModel extends IValueModel<number> {
  /** The maximum value allowed. */
  max: number;
  /** It represents the percentage of the max value being selected.  */
  percentage: number;
  /** Whether or not the selector should be displayed. */
  showSelector: boolean;
  /** The list of values that will be displayed in the selector. */
  valueList: number[];
  /** The color used for the selected value. */
  colorOn: string;
  /** The color used for the unselected value. */
  colorOff: string;
  /** The color used as the background of the selector. */
  colorBack: string;
  /** Any style to be applied to stars that represent the selected value. */
  classOn: string;
  /** Any style to be applied to star that represent the unselected value. */
  classOff: string;
  /** Any style to be applied to the background of the selector. */
  classBack: string;
}