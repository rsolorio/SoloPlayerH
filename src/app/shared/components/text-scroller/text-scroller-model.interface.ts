import { ColorG } from "src/app/core/models/color-g.class";
import { IBasicColorPalette } from "../../services/color-utility/color-utility.interface";

export interface ITextScrollerModel {
  text: string;
  palette: IBasicColorPalette;
  closeHidden: boolean;
}