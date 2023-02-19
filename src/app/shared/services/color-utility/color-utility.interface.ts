import { IColorExtractionData, IColorExtractor } from 'src/app/core/models/color-extractor-factory.class';
import { ColorG } from 'src/app/core/models/color-g.class';

export interface IColorUtilityModel {
  /** Number of colors to return from the extractor library. */
  count: number;
  /** Library to use to get the colors. */
  serviceName: ColorServiceName;
}

export interface IBasicColorPalette {
  background: ColorG;
  primary: ColorG;
  secondary: ColorG;
  dominant: ColorG;
}

export interface IFullColorPalette extends IBasicColorPalette {
  serviceName: ColorServiceName;
  colors: ColorG[];
}

export interface IColorService {
  name: ColorServiceName;
  getExtractor(): IColorExtractor;
  getColorData(imageElement: any, colorCount: number): IColorExtractionData;
  getColors(imageElement: any, colorCount: number): ColorG[];
}

export enum ColorServiceName {
  Default = 'Default',
  Custom = 'Custom',
  ColorThief = 'Color Thief',
  Colibri = 'Colibri',
  Organisol = 'Organisol'
}

export enum ColorBucketGroup {
  Background = 'background',
  Primary = 'primary',
  Secondary = 'secondary',
  Dominant = 'dominant'
}

/** Mechanism by which the list of colors on a palette should be sorted. */
export enum ColorSort {
  None = 'None',
  Contrast = 'Contrast',
  Luminance = 'Luminance'
}