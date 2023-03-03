import { ColorG } from "src/app/core/models/color-g.class";

export interface ITextScrollerModel {
  text: string;
  backgroundColor: ColorG;
  textColor: ColorG;
  closeHidden: boolean;
}