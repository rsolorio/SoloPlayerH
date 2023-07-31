import { IBasicColorPalette } from "../../services/color-utility/color-utility.interface";

export interface ITextScrollerModel {
  text: string;
  palette: IBasicColorPalette;
  closeHidden: boolean;
  bigTextEnabled?: boolean;
}