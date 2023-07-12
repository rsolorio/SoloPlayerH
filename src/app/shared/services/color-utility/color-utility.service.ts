import { Injectable } from '@angular/core';
import { IColorExtractionData } from 'src/app/core/models/color-extractor-factory.class';
import { ColorG, IColorBucket } from 'src/app/core/models/color-g.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { LocalStorageKeys } from '../local-storage/local-storage.enum';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ColorOrganisolService } from './color-organisol.service';
import { BucketPalette } from './color-utility.class';
import {
  ColorServiceName,
  IColorService,
  IFullColorPalette,
  IColorUtilityModel,
  ColorSort,
  IBasicColors
} from './color-utility.interface';

@Injectable({
  providedIn: 'root'
})
export class ColorUtilityService {

  private model: IColorUtilityModel;

  constructor(
    private utilityService: UtilityService,
    private colorOrganisol: ColorOrganisolService,
    private storage: LocalStorageService) {
      this.init();
    }

  // PUBLIC METHODS ///////////////////////////////////////////////////////////////////////////////

  public getDefaultServiceName(): ColorServiceName {
    return this.model.serviceName;
  }

  public setDefaultService(serviceName: ColorServiceName) {
    this.model.serviceName = serviceName;
    this.storage.setByKey(LocalStorageKeys.ColorUtility, this.model);
  }

  public getColors(imageElement: any): ColorG[] {
    const colorService = this.getColorService();
    const colors = colorService.getColors(imageElement, this.model.count);
    return colors;
  }

  /**
   * Creates a palette using the specified element as the source.
   * @param imageElement Html image element reference.
   * @returns A palette object.
   */
  public createPalette(imageElement: any): IFullColorPalette {
    const colorService = this.getColorService();
    const colors = colorService.getColors(imageElement, this.model.count);
    return this.buildPalette(colors[0], colors, colorService.name, ColorSort.Contrast);
  }

  /** Builds a palette object from a specified list of colors. */
  public buildPalette(
    dominantColor: ColorG, allColors: ColorG[], serviceName: ColorServiceName, sort: ColorSort): IFullColorPalette {
    const result: IFullColorPalette = {
      serviceName: serviceName,
      dominant: dominantColor,
      background: dominantColor,
      primary: null,
      secondary: null,
      colors: allColors
    };

    this.setPrimaryAndSecondaryColors(result, sort);

    return result;
  }

  public createPaletteBuckets(imageElement: any): BucketPalette {
    const colorService = this.getColorService();
    const colors = colorService.getColors(imageElement, this.model.count);
    return new BucketPalette(colors);
  }

  public fullPaletteToBasicColors(input: IFullColorPalette): IBasicColors {
    return {
      dominant: { hex: input.dominant.hex },
      background: { hex: input.background.hex },
      primary: { hex: input.primary.hex },
      secondary: { hex: input.secondary.hex },
    };
  }

  public basicColorsToFullPalette(input: IBasicColors): IFullColorPalette {
    return {
      dominant: ColorG.fromColorObject(input.dominant),
      background: ColorG.fromColorObject(input.background),
      primary: ColorG.fromColorObject(input.primary),
      secondary: ColorG.fromColorObject(input.secondary),
      colors: [],
      serviceName: ColorServiceName.Default
    }
  }

  public getColorData(imageElement: any): IColorExtractionData {
    const colorService = this.getColorService();
    return colorService.getColorData(imageElement, this.model.count);
  }

  public isWorkerSupported(): boolean {
    const service = this.getColorService();
    return service.getExtractor() !== null;
  }

  public getDefaultColors(): ColorG[] {
    // Third color: #6c757d (gray)
    return [ColorG.black, ColorG.white, ColorG.fromRgbaArray([108, 117, 125])];
  }

  public getDefaultPalette(): IFullColorPalette {
    const colors = this.getDefaultColors();
    return {
      serviceName: ColorServiceName.Default,
      dominant: colors[0],
      background: colors[0],
      primary: colors[1],
      secondary: colors[2],
      colors: colors
    };
  }

  // PRIVATE METHODS //////////////////////////////////////////////////////////////////////////////

  private init() {
    this.model = {
      count: 32,
      serviceName: ColorServiceName.Organisol
    };
  }

  private getColorService(): IColorService {
    let result: IColorService = null;
    switch (this.model.serviceName) {
      case ColorServiceName.Organisol:
        result = this.colorOrganisol;
        break;
    }
    return result;
  }

  private setPrimaryAndSecondaryColors(palette: IFullColorPalette, sort: ColorSort) {
    switch (sort) {
      case ColorSort.Contrast:
        this.sortByContrast(palette);
        break;
      case ColorSort.Luminance:
        this.sortByLuminance(palette);
        break;
    }
    palette.primary = palette.colors[0];
    palette.secondary = palette.colors[1];
  }

  private sortByContrast(palette: IFullColorPalette) {
    palette.colors.forEach(color => color.contrastColor = palette.background.rgba);
    palette.colors = this.utilityService.sort(palette.colors, 'contrast', true);
  }

  private sortByLuminance(palette: IFullColorPalette) {
    palette.colors = this.utilityService.sort(palette.colors, 'luminance', true);
  }

  /**
   * Groups colors by hue; each bucket represents a group.
   * @param colorList List of colors.
   * @returns A list of color buckets.
   */
  private gatherSameHueColors(colorList: ColorG[]): IColorBucket[] {
    const buckets = ColorG.group(colorList, (colorA, colorB) => colorA.closest.hueHex === colorB.closest.hueHex);
    buckets.forEach(bucket => {
      const firstColor = bucket.colors[0];
      bucket.selected = firstColor;
      bucket.hueCaption = firstColor.hueCaption;
    });
    return buckets;
  }
}
