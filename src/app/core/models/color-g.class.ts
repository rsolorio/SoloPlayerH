import { DeltaE00, IDeltaE00Arguments } from './delta-e-00.class';

/**
 * RGB color interface.
 */
export interface IRgbColor {
  /** The intensity of the red color. Range: 0-255. */
  r: number;
  /** The intensity of the green color. Range: 0-255. */
  g: number;
  /** The intensity of the blue color. Range: 0-255. */
  b: number;
  /** If true, the rgb values will have a percentage range: 0.0-1.0. */
  percentage?: boolean;
}

/**
 * RGBA color interface.
 */
export interface IRgbaColor extends IRgbColor {
  /** The alpha channel that specifies the opacity factor. Range 0.0-1.0. */
  a: number;
}

export interface IHslColor {
  /** The color hue. Range: 0-255 */
  hue: number;
  /** The color hue. Range: 0-360 */
  hueDegrees: number;
  /** The color saturation. Range: 0-255 */
  saturation: number;
  /** The color lightness. Range: 0-255 */
  lightness: number;
}

export interface ILabColor {
  l: number;
  a: number;
  b: number;
}

/** Interface used to gather related information about a named color. */
export interface IColorInfo {
  /** Hexadecimal color value (without #). */
  hex: string;
  /** HTML supported color name. */
  name?: string;
  /** HTML supported alternate color name. */
  alternateName?: string;
  /** Human readable color name. */
  caption: string;
  /** Related hue hex value. */
  hueHex?: string;
  /** Related hue human readable name. */
  hueCaption?: string;
  /** HTML name for the hue. */
  hueName?: string;
  /** RGB value. */
  rgb?: IRgbColor;
  /** HSL value. */
  hsl?: IHslColor;
}

export interface IColorInfoMatch extends IColorInfo {
  /** Determines if this color was found as an exact match of an hex value. */
  exactMatch?: boolean;
  /** The color difference used to find this color. */
  distance?: number;
}

export interface IColorBucket {
  groups: string[];
  dominance: number;
  colors: ColorG[];
  selected?: ColorG;
  hueCaption?: string;
}

export interface IColorG {
  hex: string;
  tagNumber: number;
  dominance: number;
}

/**
 * Col-Org is a class for handling color conversions and calculations.
 * Partially based on these libraries:
 * https://github.com/arcanis/colibrijs/
 * https://github.com/jonathantneal/convert-colors
 * https://github.com/zschuessler/DeltaE
 * https://github.com/LeaVerou/color.js
 * https://chir.ag/projects/ntc/
 * https://www.color-blindness.com/color-name-hue/
 */
export class ColorG implements IColorG {

  /** Static list of named colors. */
  private static colors = getColors();
  /** HSL value of this color. */
  private _hsl: IHslColor;
  /** Closest named color information. */
  private _closest: IColorInfoMatch;
  /** RGBA value of this color. */
  private _rgba = this.createDefaultRgba();
  public hex: string;
  private _lab: ILabColor;
  /** Generic tag. */
  public tagNumber: number;
  /** Used to give the dominance a numeric value.
   * When using the "average" method,
   * the dominance will be the number of colors used to get the value.
   */
  public dominance = 0;

  private _contrastColor = this.createDefaultRgba();
  private _contrast = 0;

  private constructor() {
  }

// STATIC /////////////////////////////////////////////////////////////////////////////////////
  public static fromRgbaArray(color: number[]): ColorG {
    const newColor = new ColorG();
    newColor.fromRgbaArray(color);
    return newColor;
  }

  public static fromRgbFormula(rgb: string): ColorG {
    const newColor = new ColorG();
    newColor.fromRgbFormula(rgb);
    return newColor;
  }

  public static fromRgbObject(color: IRgbColor): ColorG {
    const newColor = new ColorG();
    newColor.fromRgbObject(color);
    return newColor;
  }

  public static fromRgbaObject(color: IRgbaColor): ColorG {
    const newColor = new ColorG();
    newColor.fromRgbaObject(color);
    return newColor;
  }

  public static fromColorObject(color: IColorG): ColorG {
    const newColor = new ColorG();
    newColor.fromColorObject(color);
    return newColor;
  }

  public static fromRgba(r: number, g: number, b: number, a?: number): ColorG {
    const colorFormat = new ColorG();
    colorFormat.fromRgba(r, g, b, a);
    return colorFormat;
  }

  public static fromRgbaObjects(colors: IRgbaColor[]): ColorG[] {
    const result: ColorG[] = [];
    colors.forEach(color => {
      result.push(ColorG.fromRgbaObject(color));
    });
    return result;
  }

  public static fromColorObjects(colors: IColorG[]): ColorG[] {
    const result: ColorG[] = [];
    colors.forEach(color => result.push(ColorG.fromColorObject(color)));
    return result;
  }

  public static fromHexList(hexList: string[]): ColorG[] {
    const result: ColorG[] = [];
    hexList.forEach(hex => result.push(this.fromHex(hex)));
    return result;
  }

  public static fromHex(hexColor: string): ColorG {
    const result = new ColorG();
    result.fromHex(hexColor);
    return result;
  }

  public static fromHexHash(hexColor: string): ColorG {
    const result = new ColorG();
    result.fromHexHash(hexColor);
    return result;
  }

  public static fromColorName(name: string): ColorG {
    const color = new ColorG();
    color.fromColorName(name);
    return color;
  }

  public static get black(): ColorG {
    return this.fromColorName('black');
  }

  public static get white(): ColorG {
    return this.fromColorName('white');
  }

  public static get gray(): ColorG {
    return this.fromColorName('gray');
  }

  /**
   * Gets an average color from a list of colors.
   * @param colors A list of colors.
   * @returns A single color.
   */
  public static average(colors: ColorG[]): ColorG {
    const finalColor = [0, 0, 0];

    colors.forEach(color => {
      finalColor[0] += color.rgbArray[0];
      finalColor[1] += color.rgbArray[1];
      finalColor[2] += color.rgbArray[2];
    });

    finalColor[0] /= colors.length;
    finalColor[1] /= colors.length;
    finalColor[2] /= colors.length;
    const result = ColorG.fromRgbaArray(finalColor);
    result.dominance = colors.length;
    return result;
  }

  public static group(
    colorList: ColorG[], compareFn: (colorA: ColorG, colorB: ColorG) => boolean, getGroupFn?: (color: ColorG) => string): IColorBucket[] {
    const colorBuckets: IColorBucket[] = [];
    // Find a bucket for each color
    for (let colorIndex = 0; colorIndex < colorList.length; colorIndex++) {
      const color = colorList[colorIndex];
      let closestColorBucket: IColorBucket;

      // Find the proper bucket index
      let colorBucketIndex: number;
      for (colorBucketIndex = 0; colorBucketIndex < colorBuckets.length; colorBucketIndex++) {
        const colorBucket = colorBuckets[colorBucketIndex];
        const firstColor = colorBucket.colors[0];
        if (compareFn(firstColor, color)) {
          break;
        }
      }

      // DETERMINE THE PROPER BUCKET FOR THE COLOR
      // If the bucket index is not valid (matches the number of buckets) it means one of two things:
      // 1. It is the very first color and there were no buckets
      // 2. The color is not similar to any bucket
      if (colorBucketIndex === colorBuckets.length) {
        // So create a new bucket and add it to the list of buckets
        closestColorBucket = { colors: [], dominance: 0, groups: [] };
        colorBuckets.push(closestColorBucket);
      }
      else {
        // Otherwise grab the existing bucket
        closestColorBucket = colorBuckets[colorBucketIndex];
      }
      // Add the color to the bucket
      closestColorBucket.colors.push(color);
      closestColorBucket.dominance += color.dominance;
      if (getGroupFn) {
        closestColorBucket.groups.push(getGroupFn(color));
      }
    }

    return colorBuckets;
  }

// PUBLIC PROPERTIES //////////////////////////////////////////////////////////////////////////////
  public get i(): IColorG {
    return {
      hex: this.hex,
      dominance: this.dominance,
      tagNumber: this.tagNumber
    };
  }

  public get rgba(): IRgbaColor {
    return this._rgba;
  }

  public get rgbaRatio(): IRgbaColor {
    return {
      r: this.rgba.r / 255,
      g: this.rgba.g / 255,
      b: this.rgba.b / 255,
      a: this.rgba.a,
      percentage: true
    };
  }

  public get rgbFormula(): string {
    return `rgb(${this.rgba.r}, ${this.rgba.g}, ${this.rgba.b})`;
  }

  public get rgbArray(): number[] {
    return [this.rgba.r, this.rgba.g, this.rgba.b];
  }

  public get rgbRatioArray(): number[] {
    return [this.rgbaRatio.r, this.rgbaRatio.g, this.rgbaRatio.b];
  }

  public get rgbaArray(): number[] {
    const result = this.rgbArray;
    result.push(this.rgba.a);
    return result;
  }

  public get rgbaRatioArray(): number[] {
    const result = this.rgbRatioArray;
    result.push(this.rgbaRatio.a);
    return result;
  }

  public get cssColor(): any {
    return {
      color: this.rgbFormula
    };
  }

  public get cssBgColor(): any {
    return {
      'background-color': this.rgbFormula
    };
  }

  public get cssBorderColor(): any {
    return {
      'border-color': this.rgbFormula
    };
  }

  public get yuvArray(): number[] {
    const value = this.rgbRatioArray;
    return [
      value[0] * 0.299 + value[1] * 0.587 + value[2] * 0.114,
      value[0] * -0.147 + value[1] * -0.289 + value[2] * 0.436,
      value[0] * 0.615 + value[1] * -0.515 + value[2] * -0.100
    ];
  }

  public get yiqArray(): number[] {
    const value = this.rgbRatioArray;
    return [
      value[0] * 0.299 + value[1] * 0.587 + value[2] * 0.114,
      value[0] * 0.596 + value[1] * -0.275 + value[2] * -0.321,
      value[0] * 0.212 + value[1] * -0.523 + value[2] * 0.311
    ];
  }

  public get hexHash(): string {
    return `#${this.hex}`;
  }

  /**
   * Returns a value from 0.00 to 1.00 that represents the brightness of the color.
   */
  public get brightness(): number {
    const colorArray = this.rgbRatioArray;
    return Math.sqrt(
      Math.pow(colorArray[0], 2) * 0.241 +
      Math.pow(colorArray[1], 2) * 0.691 +
      Math.pow(colorArray[2], 2) * 0.068
    );
  }

  /**
   * Returns a value from 0.00 to 1.00 that represents the luminance of the color.
   */
  public get luminance(): number {
    const actualRgbArray = this.rgbRatioArray;
    const newRgbArray = actualRgbArray.map(value => {
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return newRgbArray[0] * 0.2126 + newRgbArray[1] * 0.7152 + newRgbArray[2] * 0.0722;
  }

  public get xyzArray(): number[] {
    const colorArray = this.rgbRatioArray;
    const newColorArray = colorArray.map(value => {
      return value > 0.04045 ? Math.pow((value + 0.055) / 1.055, 2.4) * 100 : value / 12.92;
    });

    const result = this.matrix(newColorArray, [
      [0.4124564, 0.3575761, 0.1804375],
      [0.2126729, 0.7151522, 0.0721750],
      [0.0193339, 0.1191920, 0.9503041]
    ]);
    return result;
  }

  public get labArray(): number[] {
    return [this.lab.l, this.lab.a, this.lab.b];
  }

  public get lab(): ILabColor {
    if (!this._lab) {
      const wd50X = 96.42;
      const wd50Y = 100;
      const wd50Z = 82.49;
      const epsilon = Math.pow(6, 3) / Math.pow(29, 3);
      const kappa = Math.pow(29, 3) / Math.pow(3, 3);
      const colorArray = this.xyzArray;
      const labMatrix = this.matrix(colorArray, [
        [ 1.0478112,  0.0228866, -0.0501270],
        [ 0.0295424,  0.9904844, -0.0170491],
        [-0.0092345,  0.0150436,  0.7521316]
      ]);

      const [f1, f2, f3] = [labMatrix[0] / wd50X, labMatrix[1] / wd50Y, labMatrix[2] / wd50Z].map(value => {
        return value > epsilon ? Math.cbrt(value) : (kappa * value + 16) / 116;
      });

      const [labL, labA, labB] = [ 116 * f2 - 16, 500 * (f1 - f2), 200 * (f2 - f3)];
      this._lab = {
        l: labL,
        a: labA,
        b: labB
      };
    }
    return this._lab;
  }

  public get hslArray(): number[] {
    return [this.hsl.hue, this.hsl.saturation, this.hsl.lightness];
  }

  public get hsl(): IHslColor {
    if (!this._hsl) {
      const hueDegrees = this.toHueDegrees();
      const value = this.toValue();
      const whiteness = this.toWhiteness();

      const delta = value - whiteness;
      const alpha = value + whiteness;
      const lightness = alpha / 2;
      let saturation = 0;
      if (delta !== 0) {
        if (lightness < 0.5) {
          saturation = delta / alpha;
        }
        else {
          saturation = delta / (2 - alpha);
        }
      }

      this._hsl = {
        hue: (hueDegrees / 360) * 255,
        hueDegrees: hueDegrees,
        saturation: saturation * 255,
        lightness: lightness * 255
      };
      // Round to 2 decimals
      this._hsl.hue = this.round(this._hsl.hue);
      this._hsl.hueDegrees = this.round(this._hsl.hueDegrees);
      this._hsl.saturation = this.round(this._hsl.saturation);
      this._hsl.lightness = this.round(this._hsl.lightness);
    }

    return this._hsl;
  }

  public get name(): string {
    return this.closest.name;
  }

  public get caption(): string {
    return this.closest.caption;
  }

  public get hueCaption(): string {
    return this.closest.hueCaption;
  }

  /**
   * Gets the information of the closest color and its hue.
   */
  public get closest(): IColorInfoMatch {
    if (!this._closest) {
      this._closest = this.findColorInfo();
    }
    return this._closest;
  }

    /** Color used to calculate the contrast. Default color is black. */
    public get contrastColor(): IRgbaColor {
      return this._contrastColor;
    }
  
    /** Color used to calculate the contrast. Default color is black. */
    public set contrastColor(color: IRgbaColor) {
      this._contrastColor = color;
      // Reset the contrast
      this._contrast = 0;
    }
  
    /**
     * Determines the contrast ratio against the contrastColor property.
     * @returns From 1 (low) to 21 (high).
     */
    public get contrast(): number {
      if (this._contrast) {
        return this._contrast;
      }
      if (!this._contrastColor) {
        this._contrastColor = this.createDefaultRgba();
      }
      // https://stackoverflow.com/questions/9733288/how-to-programmatically-calculate-the-contrast-ratio-between-two-colors
      // Minimal contrast ratio: 4.5 or 3 for larger sizes
      const lum1 = this.luminance;
      const lum2 = ColorG.fromRgbaObject(this.contrastColor).luminance;
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      this._contrast = (brightest + 0.05) / (darkest + 0.05);
      return this._contrast;
    }
  

  // PUBLIC METHODS ///////////////////////////////////////////////////////////////////////////////

  public equals(color: ColorG): boolean {
    if (!color) {
      return false;
    }
    return color.rgba.r === this.rgba.r &&
           color.rgba.g === this.rgba.g &&
           color.rgba.b === this.rgba.b &&
           color.rgba.a === this.rgba.a;
  }

  public toRgbaFormula(opacity?: number): string {
    if (opacity === undefined || opacity === null) {
      opacity = this.rgba.a;
    }
    return `rgba(${this.rgba.r}, ${this.rgba.g}, ${this.rgba.b}, ${opacity})`;
  }

  public toHslFormula(opacity?: number): string {
    if (opacity === undefined || opacity === null) {
      opacity = this.rgba.a;
    }
    const saturation = Math.round((this.hsl.saturation / 255) * 100);
    const lightness = Math.round((this.hsl.lightness / 255) * 100);
    return `hsla(${this.hsl.hueDegrees}, ${saturation}%, ${lightness}%, ${opacity})`;
  }

  /**
   * Returns the euclidean distance of the rgb value.
   * @param color The color to compare to.
   * @returns From 0.00 to 441.67
   */
  public distanceRgb(color: ColorG): number {
    return this.getEuclideanDistance(this.rgbArray, color.rgbArray);
  }

  /**
   * Returns the euclidean distance of the yuv value.
   * @param color The color to compare to.
   * @returns From 0.00 to 1.00
   */
  public distanceYuv(color: ColorG): number {
    return this.getEuclideanDistance(this.yuvArray, color.yuvArray);
  }

  /**
   * Returns the color delta based on the DeltaE 1976 algorithm.
   * @param color The color to compare to.
   * @returns From 0.00 to 100.00
   */
  public distanceDeltaE76(color: ColorG): number {
    return this.getEuclideanDistance(this.labArray, color.labArray);
  }

  /**
   * Returns the color delta based on the DeltaE 2000 algorithm.
   * @param color The color to compare to.
   * @returns From 0.00 to 100.00
   */
  public distanceDeltaE00(color: ColorG): number {
    const deltaArgs: IDeltaE00Arguments = {
      x1L: this.lab.l,
      x1A: this.lab.a,
      x1B: this.lab.b,
      x2L: color.lab.l,
      x2A: color.lab.a,
      x2B: color.lab.b,
      weightLightness: 1,
      weightChroma: 1,
      weightHue: 1
    };
    return DeltaE00.get(deltaArgs);
  }

  // PRIVATE ////////////////////////////////////////////////////////////////////////////////////

  private createDefaultRgba(): IRgbaColor {
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  private fromRgba(r: number, g: number, b: number, a?: number) {
    if (a === undefined || a === null) {
      a = 1;
    }
    this.fromRgbaArray([r, g, b, a]);
  }

  private fromRgbaArray(color: number[]) {
    this.fromRgbaObject({
      r: color[0],
      g: color[1],
      b: color[2],
      a: color.length > 3 ? color[3] : 1
    });
  }

  private fromRgbFormula(rgb: string) {
    const rgbValues = rgb.replace('rgb(', '').replace(')', '');
    const rgbArray = rgbValues.split(', ');
    this.fromRgbaArray([parseFloat(rgbArray[0]), parseFloat(rgbArray[1]), parseFloat(rgbArray[2])]);
  }

  private fromRgbObject(color: IRgbColor) {
    this.fromRgba(color.r, color.g, color.b);
  }

  /**
   * Sets the private rgba property.
   * All other "from" methods end up calling this one.
   */
  private fromRgbaObject(color: IRgbaColor) {
    this.rgba.r = color.r;
    this.rgba.g = color.g;
    this.rgba.b = color.b;
    this.rgba.a = color.a;
    this.roundRgba();
    this.rgbToHex();
  }

  private fromColorObject(color: IColorG) {
    this.fromHex(color.hex);
    this.dominance = color.dominance;
    this.tagNumber = color.tagNumber;
  }

  private fromHex(hexColor: string) {
    this.fromHexHash('#' + hexColor);
  }

  private fromHexHash(hexColor: string) {
    const hexColorMatch = /^#?(?:([a-f0-9])([a-f0-9])([a-f0-9])([a-f0-9])?|([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})?)$/i;
    const [, r, g, b, a, rr, gg, bb, aa] = hexColor.match(hexColorMatch) || [];
    if (rr !== undefined || r !== undefined) {
      const red   = rr !== undefined ? parseInt(rr, 16) : parseInt(r + r, 16);
      const green = gg !== undefined ? parseInt(gg, 16) : parseInt(g + g, 16);
      const blue  = bb !== undefined ? parseInt(bb, 16) : parseInt(b + b, 16);
      const alpha = aa !== undefined ? parseInt(aa, 16) : a !== undefined ? parseInt(a + a, 16) : 255;
      this.fromRgbaArray([red, green, blue, alpha / 255]);
    }
  }

  private fromColorName(colorName: string) {
    let colorFound = false;
    Object.values(ColorG.colors).forEach(colorInfo => {
      if (!colorFound && colorInfo.name === colorName) {
        this.fromHex(colorInfo.hex);
        // We have also found the closest color
        this._closest = colorInfo;
        colorFound = true;
      }
    });
    if (!colorFound) {
      this.fromRgba(0, 0, 0);
    }
  }

  private toHueDegrees(fallback: number = 0): number {
    const value = this.toValue();
    const whiteness = this.toWhiteness();
    const delta = value - whiteness;

    if (!delta) {
      return fallback;
    }

    const rgbRatio = this.rgbaRatio;

    let segment: number;
    if (value === rgbRatio.r) {
      segment = (rgbRatio.g - rgbRatio.b) / delta;
    }
    else if (value === rgbRatio.g) {
      segment = (rgbRatio.b - rgbRatio.r) / delta;
    }
    else {
      segment = (rgbRatio.r - rgbRatio.g) / delta;
    }

    let shift: number;
    if (value === rgbRatio.r) {
      if (segment < 0) {
        shift = 360 / 60;
      }
      else {
        shift = 0 / 60;
      }
    }
    else if (value === rgbRatio.g) {
      shift = 120 / 60;
    }
    else {
      shift = 240 / 60;
    }

    return (segment + shift) * 60;
  }

  /**
   * Gets the maximum number of the rgb values.
   */
  private toValue(): number {
    const rgbaRatio = this.rgbaRatio;
    return Math.max(rgbaRatio.r, rgbaRatio.g, rgbaRatio.b);
  }

  /**
   * Gets the minimum number of the rgb values.
   */
  private toWhiteness(): number {
    const rgbaRatio = this.rgbaRatio;
    return Math.min(rgbaRatio.r, rgbaRatio.g, rgbaRatio.b);
  }

  private componentToHex(c: number): string {
    const hex = Math.floor(c).toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
  }

  /**
   * Sets the hex property based on the rgba property.
   */
  private rgbToHex() {
    this.hex = `${this.componentToHex(this.rgba.r)}${this.componentToHex(this.rgba.g)}${this.componentToHex(this.rgba.b)}`;
  }

  private roundRgba() {
    // Round to integer
    this.rgba.r = Math.round(this.rgba.r);
    this.rgba.g = Math.round(this.rgba.g);
    this.rgba.b = Math.round(this.rgba.b);
    // Round to two decimals
    this.rgba.a = this.round(this.rgba.a);
  }

  private getEuclideanDistance(color1: number[], color2: number[]): number {
    const result = Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
      Math.pow(color1[1] - color2[1], 2) +
      Math.pow(color1[2] - color2[2], 2)
    );
    return result;
  }

  private matrix(params: number[], maps: number[][]): number[] {
    const precision = 100000000;
    return maps.map(
      item => item.reduce(
        (previousValue, currentValue, index) => {
          return previousValue + params[index] * precision * (currentValue * precision) / precision / precision;
        }, 0
      )
    );
  }

  /**
   * Finds the named color closest to this color.
   * Based on https://chir.ag/projects/ntc/ and https://www.color-blindness.com/color-name-hue/
   * @returns The color info object.
   */
  private findColorInfo(): IColorInfoMatch {
    const colorInfo = ColorG.colors[this.hex];
    if (colorInfo) {
      const exactMatchColorInfo = this.colorInfoToMatch(colorInfo, true, 0);
      const hueColorInfo = ColorG.colors[exactMatchColorInfo.hueHex];
      exactMatchColorInfo.hueCaption = hueColorInfo.caption;
      exactMatchColorInfo.hueName = hueColorInfo.name;
      return exactMatchColorInfo;
    }

    let matchingColorInfo: IColorInfoMatch;
    Object.values(ColorG.colors).forEach(colorInfoItem => {
      if (!colorInfoItem.rgb) {
        const colorG = ColorG.fromHex(colorInfoItem.hex);
        colorInfoItem.rgb = colorG.rgba;
        colorInfoItem.hsl = colorG.hsl;
      }
      if (colorInfoItem.hueHex && !colorInfoItem.hueCaption) {
        const hueColorInfo = ColorG.colors[colorInfoItem.hueHex];
        colorInfoItem.hueCaption = hueColorInfo.caption;
        colorInfoItem.hueName = hueColorInfo.name;
      }

      // Use a better algorithm to calculate color distance
      const distance = this.distanceDeltaE00(ColorG.fromHex(colorInfoItem.hex));

      if (!matchingColorInfo || matchingColorInfo.distance > distance) {
        matchingColorInfo = this.colorInfoToMatch(colorInfoItem, false, distance);
      }
    });

    if (!matchingColorInfo) {
      matchingColorInfo = this.colorInfoToMatch(ColorG.colors['000000'], false, -1);
      matchingColorInfo.name = 'Invalid color: ' + this.hexHash;
    }

    return matchingColorInfo;
  }

  /** Rounds to two decimals. */
  private round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  private colorInfoToMatch(colorInfo: IColorInfo, exactMatch: boolean, distance: number): IColorInfoMatch {
    return {
      hex: colorInfo.hex,
      name: colorInfo.name,
      alternateName: colorInfo.alternateName,
      caption: colorInfo.caption,
      hueHex: colorInfo.hueHex,
      hueCaption: colorInfo.hueCaption,
      hueName: colorInfo.hueName,
      rgb: colorInfo.rgb,
      hsl: colorInfo.hsl,
      exactMatch: exactMatch,
      distance: distance
    };
  }
}

function buildColors(items: string[][]): { [key: string]: IColorInfo } {
  const result: { [key: string]: IColorInfo } = {};
  items.forEach(item => {
    const colorInfo: IColorInfo = {
      hex: item[0],
      caption: item[1],
      hueHex: item[2]
    };
    if (item.length > 3) {
      colorInfo.name = item[3];
      if (item.length > 4) {
        colorInfo.alternateName = item[4];
      }
    }
    result[colorInfo.hex] = colorInfo;
  });
  return result;
}

/**
 * Gets a list of named colors.
 * Based on:
 * https://chir.ag/projects/ntc/
 * https://www.color-blindness.com/color-name-hue/
 * https://www.w3schools.com/colors/colors_names.asp
 * @returns A list of colors.
 */
function getColors(): { [key: string]: IColorInfo } {
  // The array format corresponds to:
  // 0: Color hex value
  // 1: Caption
  // 2: Hue hex value
  // 3: HTML color name (optional)
  // 4: Alternate HTML color name (optional)
  // The items that match Color Hex and Hue Hex are the main color hues:
  // Red (FF0000), Orange (FFA500), Yellow (FFFF00), Green (008000), Blue (0000FF),
  // Violet (EE82EE), Brown (A52A2A), Black (000000), Grey (808080), White (FFFFFF)
  // cSpell:disable
  return buildColors([
    ['35312C', 'Acadia', 'A52A2A'],
    ['75AA94', 'Acapulco', '008000'],
    ['C0E8D5', 'Aero Blue', '008000'],
    ['745085', 'Affair', 'EE82EE'],
    ['905E26', 'Afghan Tan', 'FFFF00'],
    ['5D8AA8', 'Air Force Blue', '0000FF'],
    ['BEB29A', 'Akaroa', 'FFFF00'],
    ['F2F0E6', 'Alabaster', '808080'],
    ['E1DACB', 'Albescent White', 'FFFF00'],
    ['954E2C', 'Alert Tan', 'FFA500'],
    ['F0F8FF', 'Alice Blue', '0000FF', 'aliceblue'],
    ['E32636', 'Alizarin', 'FF0000'],
    ['1F6A7D', 'Allports', '0000FF'],
    ['EED9C4', 'Almond', 'FFFF00'],
    ['9A8678', 'Almond Frost', 'A52A2A'],
    ['AD8A3B', 'Alpine', 'FFFF00'],
    ['CDC6C5', 'Alto', '808080'],
    ['848789', 'Aluminium', '808080'],
    ['E52B50', 'Amaranth', 'FF0000'],
    ['387B54', 'Amazon', '008000'],
    ['FFBF00', 'Amber', 'FFFF00'],
    ['8A7D72', 'Americano', 'A52A2A'],
    ['9966CC', 'Amethyst', 'EE82EE'],
    ['95879C', 'Amethyst Smoke', 'EE82EE'],
    ['F5E6EA', 'Amour', 'EE82EE'],
    ['7D9D72', 'Amulet', '008000'],
    ['8CCEEA', 'Anakiwa', '0000FF'],
    ['6C461F', 'Antique Brass', 'FFA500'],
    ['FAEBD7', 'Antique White', 'FFFFFF', 'antiquewhite'],
    ['C68E3F', 'Anzac', 'FFFF00'],
    ['D3A95C', 'Apache', 'FFFF00'],
    ['66B348', 'Apple', '008000'],
    ['A95249', 'Apple Blossom', 'FF0000'],
    ['DEEADC', 'Apple Green', '008000'],
    ['FBCEB1', 'Apricot', 'FFA500'],
    ['F7F0DB', 'Apricot White', 'FFFF00'],
    ['00FFFF', 'Aqua', '0000FF', 'aqua', 'cyan'],
    ['D9DDD5', 'Aqua Haze', '808080'],
    ['E8F3E8', 'Aqua Spring', '008000'],
    ['DBE4DC', 'Aqua Squeeze', '808080'],
    ['7FFFD4', 'Aquamarine', '0000FF', 'aquamarine'],
    ['274A5D', 'Arapawa', '0000FF'],
    ['484A46', 'Armadillo', '808080'],
    ['4B5320', 'Army green', '008000'],
    ['827A67', 'Arrowtown', 'FFFF00'],
    ['3B444B', 'Arsenic', '808080'],
    ['BEBAA7', 'Ash', '008000'],
    ['7BA05B', 'Asparagus', '008000'],
    ['EDD5A6', 'Astra', 'FFFF00'],
    ['376F89', 'Astral', '0000FF'],
    ['445172', 'Astronaut', '0000FF'],
    ['214559', 'Astronaut Blue', '0000FF'],
    ['DCDDDD', 'Athens Grey', '808080'],
    ['D5CBB2', 'Aths Special', 'FFFF00'],
    ['9CD03B', 'Atlantis', '008000'],
    ['2B797A', 'Atoll', '008000'],
    ['3D4B52', 'Atomic', '0000FF'],
    ['FF9966', 'Atomic Tangerine', 'FFA500'],
    ['9E6759', 'Au Chico', 'A52A2A'],
    ['372528', 'Aubergine', 'A52A2A'],
    ['712F2C', 'Auburn', 'A52A2A'],
    ['EFF8AA', 'Australian Mint', '008000'],
    ['95986B', 'Avocado', '008000'],
    ['63775A', 'Axolotl', '008000'],
    ['F9C0C4', 'Azalea', 'FF0000'],
    ['293432', 'Aztec', '008000'],
    ['F0FFFF', 'Azure', '0000FF', 'azure'],
    ['6FFFFF', 'Baby Blue', '0000FF'],
    ['25597F', 'Bahama Blue', '0000FF'],
    ['A9C01C', 'Bahia', '008000'],
    ['5C3317', 'Baker\'s Chocolate', 'A52A2A'],
    ['849CA9', 'Bali Hai', '0000FF'],
    ['3C3D3E', 'Baltic Sea', '808080'],
    ['FBE7B2', 'Banana Mania', 'FFFF00'],
    ['878466', 'Bandicoot', '008000'],
    ['D2C61F', 'Barberry', '008000'],
    ['B6935C', 'Barley Corn', 'FFFF00'],
    ['F7E5B7', 'Barley White', 'FFFF00'],
    ['452E39', 'Barossa', 'EE82EE'],
    ['2C2C32', 'Bastille', '0000FF'],
    ['51574F', 'Battleship Grey', '808080'],
    ['7BB18D', 'Bay Leaf', '008000'],
    ['353E64', 'Bay Of Many', '0000FF'],
    ['8F7777', 'Bazaar', 'A52A2A'],
    ['EBB9B3', 'Beauty Bush', 'FF0000'],
    ['926F5B', 'Beaver', 'A52A2A'],
    ['E9D7AB', 'Beeswax', 'FFFF00'],
    ['F5F5DC', 'Beige', 'A52A2A', 'beige'],
    ['86D2C1', 'Bermuda', '008000'],
    ['6F8C9F', 'Bermuda Grey', '0000FF'],
    ['BCBFA8', 'Beryl Green', '008000'],
    ['F4EFE0', 'Bianca', 'FFFF00'],
    ['334046', 'Big Stone', '0000FF'],
    ['3E8027', 'Bilbao', '008000'],
    ['AE99D2', 'Biloba Flower', 'EE82EE'],
    ['3F3726', 'Birch', 'FFFF00'],
    ['D0C117', 'Bird Flower', '008000'],
    ['2F3C53', 'Biscay', '0000FF'],
    ['486C7A', 'Bismark', '0000FF'],
    ['B5AC94', 'Bison Hide', 'FFFF00'],
    ['FFE4C4', 'Bisque', 'A52A2A', 'bisque'],
    ['3D2B1F', 'Bistre', 'A52A2A'],
    ['88896C', 'Bitter', '008000'],
    ['D2DB32', 'Bitter Lemon', '008000'],
    ['FE6F5E', 'Bittersweet', 'FFA500'],
    ['E7D2C8', 'Bizarre', 'FFA500'],
    ['000000', 'Black', '000000', 'black'],
    ['232E26', 'Black Bean', '008000'],
    ['2C3227', 'Black Forest', '008000'],
    ['E0DED7', 'Black Haze', '808080'],
    ['332C22', 'Black Magic', 'A52A2A'],
    ['383740', 'Black Marlin', '0000FF'],
    ['1E272C', 'Black Pearl', '0000FF'],
    ['2C2D3C', 'Black Rock', '0000FF'],
    ['532934', 'Black Rose', 'FF0000'],
    ['24252B', 'Black Russian', '808080'],
    ['E5E6DF', 'Black Squeeze', '808080'],
    ['E5E4DB', 'Black White', '808080'],
    ['43182F', 'Blackberry', 'EE82EE'],
    ['2E183B', 'Blackcurrant', 'EE82EE'],
    ['D9D0C1', 'Blanc', 'FFFF00'],
    ['FFEBCD', 'Blanched Almond', 'A52A2A', 'blanchedalmond'],
    ['EBE1CE', 'Bleach White', 'FFFF00'],
    ['A3E3ED', 'Blizzard Blue', '0000FF'],
    ['DFB1B6', 'Blossom', 'FF0000'],
    ['0000FF', 'Blue', '0000FF', 'blue'],
    ['62777E', 'Blue Bayoux', '0000FF'],
    ['9999CC', 'Blue Bell', '0000FF'],
    ['E3D6E9', 'Blue Chalk', 'EE82EE'],
    ['262B2F', 'Blue Charcoal', '0000FF'],
    ['408F90', 'Blue Chill', '008000'],
    ['4B2D72', 'Blue Diamond', 'EE82EE'],
    ['35514F', 'Blue Dianne', '008000'],
    ['4B3C8E', 'Blue Gem', 'EE82EE'],
    ['BDBACE', 'Blue Haze', 'EE82EE'],
    ['00626F', 'Blue Lagoon', '008000'],
    ['6A5BB1', 'Blue Marguerite', 'EE82EE'],
    ['D8F0D2', 'Blue Romance', '008000'],
    ['78857A', 'Blue Smoke', '008000'],
    ['166461', 'Blue Stone', '008000'],
    ['8A2BE2', 'Blue Violet', 'EE82EE', 'blueviolet'],
    ['1E3442', 'Blue Whale', '0000FF'],
    ['3C4354', 'Blue Zodiac', '0000FF'],
    ['305C71', 'Blumine', '0000FF'],
    ['B55067', 'Blush', 'FF0000'],
    ['2A2725', 'Bokara Grey', '808080'],
    ['79443B', 'Bole', 'A52A2A'],
    ['AEAEAD', 'Bombay', '808080'],
    ['DFD7D2', 'Bon Jour', '808080'],
    ['0095B6', 'Bondi Blue', '0000FF'],
    ['DBC2AB', 'Bone', 'FFA500'],
    ['4C1C24', 'Bordeaux', 'FF0000'],
    ['4C3D4E', 'Bossanova', 'EE82EE'],
    ['438EAC', 'Boston Blue', '0000FF'],
    ['92ACB4', 'Botticelli', '0000FF'],
    ['254636', 'Bottle Green', '008000'],
    ['7C817C', 'Boulder', '808080'],
    ['A78199', 'Bouquet', 'EE82EE'],
    ['AF6C3E', 'Bourbon', 'FFA500'],
    ['5B3D27', 'Bracken', 'A52A2A'],
    ['DCB68A', 'Brandy', 'FFA500'],
    ['C07C40', 'Brandy Punch', 'FFA500'],
    ['B6857A', 'Brandy Rose', 'FF0000'],
    ['B5A642', 'Brass', 'FFFF00'],
    ['517B78', 'Breaker Bay', '008000'],
    ['C62D42', 'Brick Red', 'FF0000'],
    ['F8EBDD', 'Bridal Heath', 'FFA500'],
    ['FAE6DF', 'Bridesmaid', 'FFA500'],
    ['66FF00', 'Bright Green', '008000'],
    ['57595D', 'Bright Grey', '808080'],
    ['922A31', 'Bright Red', 'FF0000'],
    ['ECBD2C', 'Bright Sun', 'FFFF00'],
    ['08E8DE', 'Bright Turquoise', '0000FF'],
    ['FF55A3', 'Brilliant Rose', 'FF0000'],
    ['FB607F', 'Brink Pink', 'FF0000'],
    ['004225', 'British Racing Green', '008000'],
    ['A79781', 'Bronco', 'A52A2A'],
    ['CD7F32', 'Bronze', 'A52A2A'],
    ['584C25', 'Bronze Olive', 'FFFF00'],
    ['434C28', 'Bronzetone', 'FFFF00'],
    ['EECC24', 'Broom', 'FFFF00'],
    ['A52A2A', 'Brown', 'A52A2A', 'brown'],
    ['53331E', 'Brown Bramble', 'A52A2A'],
    ['594537', 'Brown Derby', 'A52A2A'],
    ['3C241B', 'Brown Pod', 'A52A2A'],
    ['E6F2EA', 'Bubbles', '008000'],
    ['6E5150', 'Buccaneer', 'FF0000'],
    ['A5A88F', 'Bud', '008000'],
    ['BC9B1B', 'Buddha Gold', 'FFFF00'],
    ['F0DC82', 'Buff', 'FFFF00'],
    ['482427', 'Bulgarian Rose', 'FF0000'],
    ['75442B', 'Bull Shot', 'FFA500'],
    ['292C2F', 'Bunker', '808080'],
    ['2B3449', 'Bunting', '0000FF'],
    ['800020', 'Burgundy', 'FF0000'],
    ['DEB887', 'Burly Wood', 'A52A2A', 'burlywood'],
    ['234537', 'Burnham', '008000'],
    ['D08363', 'Burning Sand', 'FFA500'],
    ['582124', 'Burnt Crimson', 'FF0000'],
    ['FF7034', 'Burnt Orange', 'FFA500'],
    ['E97451', 'Burnt Sienna', 'A52A2A'],
    ['8A3324', 'Burnt Umber', 'A52A2A'],
    ['DA9429', 'Buttercup', 'FFFF00'],
    ['9D702E', 'Buttered Rum', 'FFFF00'],
    ['68578C', 'Butterfly Bush', 'EE82EE'],
    ['F6E0A4', 'Buttermilk', 'FFFF00'],
    ['F1EBDA', 'Buttery White', 'FFFF00'],
    ['4A2E32', 'Cab Sav', 'FF0000'],
    ['CD526C', 'Cabaret', 'FF0000'],
    ['4C5544', 'Cabbage Pont', '008000'],
    ['5B6F55', 'Cactus', '008000'],
    ['5F9EA0', 'Cadet Blue', '0000FF', 'cadetblue'],
    ['984961', 'Cadillac', 'FF0000'],
    ['6A4928', 'Cafe Royale', 'A52A2A'],
    ['D5B185', 'Calico', 'A52A2A'],
    ['E98C3A', 'California', 'FFA500'],
    ['3D7188', 'Calypso', '0000FF'],
    ['206937', 'Camarone', '008000'],
    ['803A4B', 'Camelot', 'FF0000'],
    ['CCA483', 'Cameo', 'A52A2A'],
    ['4F4D32', 'Camouflage', 'FFFF00'],
    ['78866B', 'Camouflage Green', '008000'],
    ['D08A9B', 'Can Can', 'FF0000'],
    ['FFFF99', 'Canary', 'FFFF00'],
    ['8E5164', 'Cannon Pink', 'FF0000'],
    ['4E5552', 'Cape Cod', '808080'],
    ['FEE0A5', 'Cape Honey', 'FFFF00'],
    ['75482F', 'Cape Palliser', 'FFA500'],
    ['AFC182', 'Caper', '008000'],
    ['592720', 'Caput Mortuum', 'A52A2A'],
    ['FFD59A', 'Caramel', 'FFFF00'],
    ['EBE5D5', 'Cararra', '008000'],
    ['1B3427', 'Cardin Green', '008000'],
    ['C41E3A', 'Cardinal', 'FF0000'],
    ['C99AA0', 'Careys Pink', 'FF0000'],
    ['00CC99', 'Caribbean Green', '008000'],
    ['E68095', 'Carissma', 'FF0000'],
    ['F5F9CB', 'Carla', '008000'],
    ['960018', 'Carmine', 'FF0000'],
    ['5B3A24', 'Carnaby Tan', 'A52A2A'],
    ['FFA6C9', 'Carnation Pink', 'FF0000'],
    ['F8DBE0', 'Carousel Pink', 'FF0000'],
    ['ED9121', 'Carrot Orange', 'FFA500'],
    ['F0B253', 'Casablanca', 'FFFF00'],
    ['3F545A', 'Casal', '0000FF'],
    ['8CA8A0', 'Cascade', '008000'],
    ['D1B399', 'Cashmere', 'A52A2A'],
    ['AAB5B8', 'Casper', '0000FF'],
    ['44232F', 'Castro', 'FF0000'],
    ['273C5A', 'Catalina Blue', '0000FF'],
    ['E0E4DC', 'Catskill White', '808080'],
    ['E0B8B1', 'Cavern Pink', 'FF0000'],
    ['9271A7', 'Ce Soir', 'EE82EE'],
    ['463430', 'Cedar', 'A52A2A'],
    ['ACE1AF', 'Celadon', '008000'],
    ['B4C04C', 'Celery', '008000'],
    ['D2D2C0', 'Celeste', '008000'],
    ['3A4E5F', 'Cello', '0000FF'],
    ['2B3F36', 'Celtic', '008000'],
    ['857158', 'Cement', 'A52A2A'],
    ['DE3163', 'Cerise', 'EE82EE'],
    ['007BA7', 'Cerulean', '0000FF'],
    ['2A52BE', 'Cerulean Blue', '0000FF'],
    ['FDE9E0', 'Chablis', 'FF0000'],
    ['5A6E41', 'Chalet Green', '008000'],
    ['DFC281', 'Chalky', 'FFFF00'],
    ['475877', 'Chambray', '0000FF'],
    ['E8CD9A', 'Chamois', 'FFFF00'],
    ['EED9B6', 'Champagne', 'FFFF00'],
    ['EDB8C7', 'Chantilly', 'FF0000'],
    ['394043', 'Charade', '0000FF'],
    ['464646', 'Charcoal', '808080'],
    ['F8EADF', 'Chardon', 'FFA500'],
    ['FFC878', 'Chardonnay', 'FFFF00'],
    ['A4DCE6', 'Charlotte', '0000FF'],
    ['D0748B', 'Charm', 'FF0000'],
    ['7FFF00', 'Chartreuse', '008000', 'chartreuse'],
    ['DFFF00', 'Chartreuse Yellow', 'FFFF00'],
    ['419F59', 'Chateau Green', '008000'],
    ['B3ABB6', 'Chatelle', 'EE82EE'],
    ['2C5971', 'Chathams Blue', '0000FF'],
    ['88A95B', 'Chelsea Cucumber', '008000'],
    ['95532F', 'Chelsea Gem', 'FFA500'],
    ['DEC371', 'Chenin', 'FFFF00'],
    ['F5CD82', 'Cherokee', 'FFFF00'],
    ['372D52', 'Cherry Pie', 'EE82EE'],
    ['F5D7DC', 'Cherub', 'FF0000'],
    ['B94E48', 'Chestnut', 'A52A2A'],
    ['666FB4', 'Chetwode Blue', '0000FF'],
    ['5B5D56', 'Chicago', '808080'],
    ['F0F5BB', 'Chiffon', '008000'],
    ['D05E34', 'Chilean Fire', 'FFA500'],
    ['F9F7DE', 'Chilean Heath', '008000'],
    ['FBF3D3', 'China Ivory', '008000'],
    ['B8AD8A', 'Chino', 'FFFF00'],
    ['9DD3A8', 'Chinook', '008000'],
    ['D2691E', 'Chocolate', 'A52A2A', 'chocolate'],
    ['382161', 'Christalle', 'EE82EE'],
    ['71A91D', 'Christi', '008000'],
    ['BF652E', 'Christine', 'FFA500'],
    ['CAC7B7', 'Chrome White', '008000'],
    ['7D4E38', 'Cigar', 'A52A2A'],
    ['242A2E', 'Cinder', '808080'],
    ['FBD7CC', 'Cinderella', 'FF0000'],
    ['E34234', 'Cinnabar', 'FF0000'],
    ['5D3B2E', 'Cioccolato', 'A52A2A'],
    ['8E9A21', 'Citron', '008000'],
    ['9FB70A', 'Citrus', '008000'],
    ['D2B3A9', 'Clam Shell', 'FFA500'],
    ['6E2233', 'Claret', 'FF0000'],
    ['F4C8DB', 'Classic Rose', 'EE82EE'],
    ['897E59', 'Clay Creek', 'FFFF00'],
    ['DFEFEA', 'Clear Day', '008000'],
    ['463623', 'Clinker', 'A52A2A'],
    ['C2BCB1', 'Cloud', 'FFFF00'],
    ['353E4F', 'Cloud Burst', '0000FF'],
    ['B0A99F', 'Cloudy', 'A52A2A'],
    ['47562F', 'Clover', '008000'],
    ['0047AB', 'Cobalt', '0000FF'],
    ['4F3835', 'Cocoa Bean', 'FF0000'],
    ['35281E', 'Cocoa Brown', 'A52A2A'],
    ['E1DABB', 'Coconut Cream', '008000'],
    ['2D3032', 'Cod Grey', '808080'],
    ['726751', 'Coffee', 'FFFF00'],
    ['362D26', 'Coffee Bean', 'A52A2A'],
    ['9A463D', 'Cognac', 'FF0000'],
    ['3C2F23', 'Cola', 'A52A2A'],
    ['9D8ABF', 'Cold Purple', 'EE82EE'],
    ['CAB5B2', 'Cold Turkey', 'FF0000'],
    ['9BDDFF', 'Columbia Blue', '0000FF'],
    ['636373', 'Comet', '0000FF'],
    ['4C785C', 'Como', '008000'],
    ['A0B1AE', 'Conch', '008000'],
    ['827F79', 'Concord', '808080'],
    ['D2D1CD', 'Concrete', '808080'],
    ['DDCB46', 'Confetti', '008000'],
    ['654D49', 'Congo Brown', 'A52A2A'],
    ['B1DD52', 'Conifer', '008000'],
    ['C16F68', 'Contessa', 'FF0000'],
    ['DA8A67', 'Copper', 'FF0000'],
    ['77422C', 'Copper Canyon', 'FFA500'],
    ['996666', 'Copper Rose', 'EE82EE'],
    ['95524C', 'Copper Rust', 'FF0000'],
    ['FF7F50', 'Coral', 'FFA500', 'coral'],
    ['F5D0C9', 'Coral Candy', 'FF0000'],
    ['FF4040', 'Coral Red', 'FF0000'],
    ['AB6E67', 'Coral Tree', 'FF0000'],
    ['404D49', 'Corduroy', '008000'],
    ['BBB58D', 'Coriander', '008000'],
    ['5A4C42', 'Cork', 'A52A2A'],
    ['FBEC5D', 'Corn', 'FFFF00'],
    ['F8F3C4', 'Corn Field', '008000'],
    ['42426F', 'Corn Flower Blue', '0000FF', 'cornflowerblue'],
    ['8D702A', 'Corn Harvest', 'FFFF00'],
    ['FFF8DC', 'Corn Silk', 'FFFF00', 'cornsilk'],
    ['93CCEA', 'Cornflower', '0000FF'],
    ['6495ED', 'Cornflower Blue', '0000FF'],
    ['E9BA81', 'Corvette', 'FFA500'],
    ['794D60', 'Cosmic', 'EE82EE'],
    ['E1F8E7', 'Cosmic Latte', 'FFFFFF'],
    ['FCD5CF', 'Cosmos', 'FF0000'],
    ['625D2A', 'Costa Del Sol', '008000'],
    ['FFB7D5', 'Cotton Candy', 'FF0000'],
    ['BFBAAF', 'Cotton Seed', 'FFFF00'],
    ['1B4B35', 'County Green', '008000'],
    ['443736', 'Cowboy', 'A52A2A'],
    ['87382F', 'Crab Apple', 'FF0000'],
    ['A65648', 'Crail', 'FF0000'],
    ['DB5079', 'Cranberry', 'FF0000'],
    ['4D3E3C', 'Crater Brown', 'A52A2A'],
    ['FFFDD0', 'Cream', 'FFFFFF'],
    ['FFE39B', 'Cream Brulee', 'FFFF00'],
    ['EEC051', 'Cream Can', 'FFFF00'],
    ['393227', 'Creole', 'A52A2A'],
    ['77712B', 'Crete', '008000'],
    ['DC143C', 'Crimson', 'FF0000', 'crimson'],
    ['706950', 'Crocodile', 'FFFF00'],
    ['763C33', 'Crown Of Thorns', 'FF0000'],
    ['B4E2D5', 'Cruise', '008000'],
    ['165B31', 'Crusoe', '008000'],
    ['F38653', 'Crusta', 'FFA500'],
    ['784430', 'Cumin', 'FFA500'],
    ['F5F4C1', 'Cumulus', '008000'],
    ['F5B2C5', 'Cupid', 'FF0000'],
    ['3D85B8', 'Curious Blue', '0000FF'],
    ['5C8173', 'Cutty Sark', '008000'],
    ['0F4645', 'Cyprus', '008000'],
    ['EDD2A4', 'Dairy Cream', 'FFFF00'],
    ['5B3E90', 'Daisy Bush', 'EE82EE'],
    ['664A2D', 'Dallas', 'A52A2A'],
    ['FED85D', 'Dandelion', 'FFFF00'],
    ['5B89C0', 'Danube', '0000FF'],
    ['00008B', 'Dark Blue', '0000FF', 'darkblue'],
    ['654321', 'Dark Brown', 'A52A2A'],
    ['08457E', 'Dark Cerulean', '0000FF'],
    ['986960', 'Dark Chestnut', 'FF0000'],
    ['CD5B45', 'Dark Coral', 'FFA500'],
    ['008B8B', 'Dark Cyan', '008000', 'darkcyan'],
    ['B8860B', 'Dark Goldenrod', 'FFFF00', 'darkgoldenrod'],
    ['A9A9A9', 'Dark Gray', '808080', 'darkgray'],
    ['013220', 'Dark Green', '008000', 'darkgreen'],
    ['4A766E', 'Dark Green Copper', '008000'],
    ['BDB76B', 'Dark Khaki', 'FFFF00', 'darkkhaki'],
    ['8B008B', 'Dark Magenta', 'EE82EE', 'darkmagenta'],
    ['556B2F', 'Dark Olive Green', '008000', 'darkolivegreen'],
    ['FF8C00', 'Dark Orange', 'FFA500', 'darkorange'],
    ['9932CC', 'Dark Orchid', 'EE82EE', 'darkorchid'],
    ['03C03C', 'Dark Pastel Green', '008000'],
    ['E75480', 'Dark Pink', 'FF0000'],
    ['871F78', 'Dark Purple', 'EE82EE'],
    ['8B0000', 'Dark Red', 'FF0000', 'darkred'],
    ['45362B', 'Dark Rum', 'A52A2A'],
    ['E9967A', 'Dark Salmon', 'FFA500', 'darksalmon'],
    ['8FBC8F', 'Dark Sea Green', '008000', 'darkseagreen'],
    ['465352', 'Dark Slate', '008000'],
    ['483D8B', 'Dark Slate Blue', '0000FF', 'darkslateblue'],
    ['2F4F4F', 'Dark Slate Grey', '808080', 'darkslategray'],
    ['177245', 'Dark Spring Green', '008000'],
    ['97694F', 'Dark Tan', 'A52A2A'],
    ['FFA812', 'Dark Tangerine', 'FFA500'],
    ['00CED1', 'Dark Turquoise', '0000FF', 'darkturquoise'],
    ['9400D3', 'Dark Violet', 'EE82EE', 'darkviolet'],
    ['855E42', 'Dark Wood', 'A52A2A'],
    ['788878', 'Davy\'s Grey', '808080'],
    ['9F9D91', 'Dawn', '008000'],
    ['E6D6CD', 'Dawn Pink', 'FFA500'],
    ['85CA87', 'De York', '008000'],
    ['CCCF82', 'Deco', '008000'],
    ['E36F8A', 'Deep Blush', 'FF0000'],
    ['51412D', 'Deep Bronze', 'A52A2A'],
    ['DA3287', 'Deep Cerise', 'EE82EE'],
    ['193925', 'Deep Fir', '008000'],
    ['343467', 'Deep Koamaru', 'EE82EE'],
    ['9955BB', 'Deep Lilac', 'EE82EE'],
    ['CC00CC', 'Deep Magenta', 'EE82EE'],
    ['FF1493', 'Deep Pink', 'FF0000', 'deeppink'],
    ['167E65', 'Deep Sea', '008000'],
    ['00BFFF', 'Deep Sky Blue', '0000FF', 'deepskyblue'],
    ['19443C', 'Deep Teal', '008000'],
    ['B5998E', 'Del Rio', 'A52A2A'],
    ['486531', 'Dell', '008000'],
    ['999B95', 'Delta', '808080'],
    ['8272A4', 'Deluge', 'EE82EE'],
    ['1560BD', 'Denim', '0000FF'],
    ['F9E4C6', 'Derby', 'FFFF00'],
    ['A15F3B', 'Desert', 'FFA500'],
    ['EDC9AF', 'Desert Sand', 'A52A2A'],
    ['EDE7E0', 'Desert Storm', '808080'],
    ['E7F2E9', 'Dew', '008000'],
    ['322C2B', 'Diesel', '808080'],
    ['696969', 'Dim Gray', '808080', 'dimgray'],
    ['607C47', 'Dingley', '008000'],
    ['892D4F', 'Disco', 'FF0000'],
    ['CD8431', 'Dixie', 'FFFF00'],
    ['1E90FF', 'Dodger Blue', '0000FF', 'dodgerblue'],
    ['F5F171', 'Dolly', 'FFFF00'],
    ['6A6873', 'Dolphin', 'EE82EE'],
    ['6C5B4C', 'Domino', 'A52A2A'],
    ['5A4F51', 'Don Juan', 'A52A2A'],
    ['816E5C', 'Donkey Brown', 'A52A2A'],
    ['6E5F56', 'Dorado', 'A52A2A'],
    ['E4CF99', 'Double Colonial White', 'FFFF00'],
    ['E9DCBE', 'Double Pearl Lusta', 'FFFF00'],
    ['D2C3A3', 'Double Spanish White', 'FFFF00'],
    ['777672', 'Dove Grey', '808080'],
    ['6FD2BE', 'Downy', '008000'],
    ['FBEB9B', 'Drover', 'FFFF00'],
    ['514F4A', 'Dune', '808080'],
    ['E5CAC0', 'Dust Storm', 'FFA500'],
    ['AC9B9B', 'Dusty Grey', '808080'],
    ['F0DFBB', 'Dutch White', 'FFFF00'],
    ['B0AC94', 'Eagle', '008000'],
    ['B8A722', 'Earls Green', '008000'],
    ['FBF2DB', 'Early Dawn', 'FFFF00'],
    ['47526E', 'East Bay', '0000FF'],
    ['AA8CBC', 'East Side', 'EE82EE'],
    ['00879F', 'Eastern Blue', '0000FF'],
    ['E6D8D4', 'Ebb', 'FF0000'],
    ['313337', 'Ebony', '808080'],
    ['323438', 'Ebony Clay', '808080'],
    ['A4AFCD', 'Echo Blue', '0000FF'],
    ['3F3939', 'Eclipse', '808080'],
    ['C2B280', 'Ecru', 'A52A2A'],
    ['D6D1C0', 'Ecru White', '008000'],
    ['C96138', 'Ecstasy', 'FFA500'],
    ['266255', 'Eden', '008000'],
    ['C1D8C5', 'Edgewater', '008000'],
    ['97A49A', 'Edward', '008000'],
    ['F9E4C5', 'Egg Sour', 'FFFF00'],
    ['990066', 'Eggplant', 'EE82EE'],
    ['1034A6', 'Egyptian Blue', '0000FF'],
    ['39392C', 'El Paso', '008000'],
    ['8F4E45', 'El Salva', 'FF0000'],
    ['7DF9FF', 'Electric Blue', '0000FF'],
    ['6600FF', 'Electric Indigo', 'EE82EE'],
    ['CCFF00', 'Electric Lime', '008000'],
    ['BF00FF', 'Electric Purple', 'EE82EE'],
    ['243640', 'Elephant', '0000FF'],
    ['1B8A6B', 'Elf Green', '008000'],
    ['297B76', 'Elm', '008000'],
    ['50C878', 'Emerald', '008000'],
    ['6E3974', 'Eminence', 'EE82EE'],
    ['50494A', 'Emperor', '808080'],
    ['7C7173', 'Empress', '808080'],
    ['29598B', 'Endeavour', '0000FF'],
    ['F5D752', 'Energy Yellow', 'FFFF00'],
    ['274234', 'English Holly', '008000'],
    ['8BA58F', 'Envy', '008000'],
    ['DAB160', 'Equator', 'FFFF00'],
    ['4E312D', 'Espresso', 'FF0000'],
    ['2D2F28', 'Eternity', '008000'],
    ['329760', 'Eucalyptus', '008000'],
    ['CDA59C', 'Eunry', 'FF0000'],
    ['26604F', 'Evening Sea', '008000'],
    ['264334', 'Everglade', '008000'],
    ['F3E5DC', 'Fair Pink', 'FFA500'],
    ['6E5A5B', 'Falcon', 'A52A2A'],
    ['C19A6B', 'Fallow', 'A52A2A'],
    ['801818', 'Falu Red', 'FF0000'],
    ['F2E6DD', 'Fantasy', 'FFA500'],
    ['625665', 'Fedora', 'EE82EE'],
    ['A5D785', 'Feijoa', '008000'],
    ['4D5D53', 'Feldgrau', '808080'],
    ['D19275', 'Feldspar', 'FF0000'],
    ['63B76C', 'Fern', '008000'],
    ['4F7942', 'Fern Green', '008000'],
    ['876A68', 'Ferra', 'A52A2A'],
    ['EACC4A', 'Festival', 'FFFF00'],
    ['DBE0D0', 'Feta', '008000'],
    ['B1592F', 'Fiery Orange', 'FFA500'],
    ['636F22', 'Fiji Green', '008000'],
    ['75785A', 'Finch', '008000'],
    ['61755B', 'Finlandia', '008000'],
    ['694554', 'Finn', 'EE82EE'],
    ['4B5A62', 'Fiord', '0000FF'],
    ['8F3F2A', 'Fire', 'FFA500'],
    ['B22222', 'Fire Brick', 'FF0000', 'firebrick'],
    ['E09842', 'Fire Bush', 'FFFF00'],
    ['CE1620', 'Fire Engine Red', 'FF0000'],
    ['314643', 'Firefly', '008000'],
    ['BE5C48', 'Flame Pea', 'FFA500'],
    ['86282E', 'Flame Red', 'FF0000'],
    ['EA8645', 'Flamenco', 'FFA500'],
    ['E1634F', 'Flamingo', 'FFA500'],
    ['EEDC82', 'Flax', 'FFFF00'],
    ['716E61', 'Flint', '008000'],
    ['7A2E4D', 'Flirt', 'FF0000'],
    ['FFFAF0', 'Floral White', 'FFFFFF', 'floralwhite'],
    ['D0EAE8', 'Foam', '008000'],
    ['D5C7E8', 'Fog', 'EE82EE'],
    ['A7A69D', 'Foggy Grey', '808080'],
    ['228B22', 'Forest Green', '008000', 'forestgreen'],
    ['FDEFDB', 'Forget Me Not', 'FFFF00'],
    ['65ADB2', 'Fountain Blue', '0000FF'],
    ['FFD7A0', 'Frangipani', 'FFFF00'],
    ['029D74', 'Free Speech Aquamarine', '008000'],
    ['4156C5', 'Free Speech Blue', '0000FF'],
    ['09F911', 'Free Speech Green', '008000'],
    ['E35BD8', 'Free Speech Magenta', 'FF0000'],
    ['C00000', 'Free Speech Red', 'FF0000'],
    ['BFBDC1', 'French Grey', '808080'],
    ['DEB7D9', 'French Lilac', 'EE82EE'],
    ['A4D2E0', 'French Pass', '0000FF'],
    ['F64A8A', 'French Rose', 'FF0000'],
    ['86837A', 'Friar Grey', '808080'],
    ['B4E1BB', 'Fringy Flower', '008000'],
    ['E56D75', 'Froly', 'FF0000'],
    ['E1E4C5', 'Frost', '008000'],
    ['E2F2E4', 'Frosted Mint', '008000'],
    ['DBE5D2', 'Frostee', '008000'],
    ['4BA351', 'Fruit Salad', '008000'],
    ['C154C1', 'Fuchsia', 'EE82EE', 'fuchsia'],
    ['FF77FF', 'Fuchsia Pink', 'FF0000'],
    ['C2D62E', 'Fuego', '008000'],
    ['D19033', 'Fuel Yellow', 'FFFF00'],
    ['335083', 'Fun Blue', '0000FF'],
    ['15633D', 'Fun Green', '008000'],
    ['3C3B3C', 'Fuscous Grey', '808080'],
    ['C45655', 'Fuzzy Wuzzy Brown', 'A52A2A'],
    ['2C4641', 'Gable Green', '008000'],
    ['DCDCDC', 'Gainsboro', 'FFFFFF', 'gainsboro'],
    ['DCD7D1', 'Gallery', '808080'],
    ['D8A723', 'Galliano', 'FFFF00'],
    ['E49B0F', 'Gamboge', 'FFFF00'],
    ['C5832E', 'Geebung', 'FFFF00'],
    ['31796D', 'Genoa', '008000'],
    ['E77B75', 'Geraldine', 'FF0000'],
    ['CBD0CF', 'Geyser', '808080'],
    ['C0BFC7', 'Ghost', '0000FF'],
    ['F8F8FF', 'Ghost White', 'FFFFFF', 'ghostwhite'],
    ['564786', 'Gigas', 'EE82EE'],
    ['B9AD61', 'Gimblet', '008000'],
    ['D9DFCD', 'Gin', '008000'],
    ['F8EACA', 'Gin Fizz', 'FFFF00'],
    ['EBD4AE', 'Givry', 'FFFF00'],
    ['78B1BF', 'Glacier', '0000FF'],
    ['5F8151', 'Glade Green', '008000'],
    ['786E4C', 'Go Ben', 'FFFF00'],
    ['34533D', 'Goblin', '008000'],
    ['FFD700', 'Gold', 'FFFF00', 'gold'],
    ['D56C30', 'Gold Drop', 'FFA500'],
    ['E2B227', 'Gold Tips', 'FFFF00'],
    ['CA8136', 'Golden Bell', 'FFA500'],
    ['996515', 'Golden Brown', 'A52A2A'],
    ['F1CC2B', 'Golden Dream', 'FFFF00'],
    ['EBDE31', 'Golden Fizz', '008000'],
    ['F9D77E', 'Golden Glow', 'FFFF00'],
    ['FCC200', 'Golden Poppy', 'FFFF00'],
    ['EACE6A', 'Golden Sand', 'FFFF00'],
    ['FFC152', 'Golden Tainoi', 'FFFF00'],
    ['FFDF00', 'Golden Yellow', 'FFFF00'],
    ['DBDB70', 'Goldenrod', 'FFFF00', 'goldenrod'],
    ['373332', 'Gondola', '808080'],
    ['29332B', 'Gordons Green', '008000'],
    ['FDE336', 'Gorse', 'FFFF00'],
    ['399F86', 'Gossamer', '008000'],
    ['9FD385', 'Gossip', '008000'],
    ['698890', 'Gothic', '0000FF'],
    ['51559B', 'Governor Bay', '0000FF'],
    ['CAB8A2', 'Grain Brown', 'FFFF00'],
    ['FFCD73', 'Grandis', 'FFFF00'],
    ['8B8265', 'Granite Green', 'FFFF00'],
    ['C5E7CD', 'Granny Apple', '008000'],
    ['7B948C', 'Granny Smith', '008000'],
    ['9DE093', 'Granny Smith Apple', '008000'],
    ['413D4B', 'Grape', 'EE82EE'],
    ['383428', 'Graphite', 'FFFF00'],
    ['4A4B46', 'Gravel', '808080'],
    ['008000', 'Green', '008000', 'green'],
    ['3E6334', 'Green House', '008000'],
    ['393D2A', 'Green Kelp', '008000'],
    ['526B2D', 'Green Leaf', '008000'],
    ['BFC298', 'Green Mist', '008000'],
    ['266242', 'Green Pea', '008000'],
    ['9CA664', 'Green Smoke', '008000'],
    ['A9AF99', 'Green Spring', '008000'],
    ['23414E', 'Green Vogue', '0000FF'],
    ['2C2D24', 'Green Waterloo', '008000'],
    ['DEDDCB', 'Green White', '008000'],
    ['ADFF2F', 'Green Yellow', '008000', 'greenyellow'],
    ['C14D36', 'Grenadier', 'FFA500'],
    ['808080', 'Grey', '808080', 'gray', 'grey'],
    ['9FA3A7', 'Grey Chateau', '808080'],
    ['BDBAAE', 'Grey Nickel', '008000'],
    ['D1D3CC', 'Grey Nurse', '808080'],
    ['A19A7F', 'Grey Olive', 'FFFF00'],
    ['9391A0', 'Grey Suit', '0000FF'],
    ['465945', 'Grey-Asparagus', '008000'],
    ['952E31', 'Guardsman Red', 'FF0000'],
    ['343F5C', 'Gulf Blue', '0000FF'],
    ['74B2A8', 'Gulf Stream', '008000'],
    ['A4ADB0', 'Gull Grey', '808080'],
    ['ACC9B2', 'Gum Leaf', '008000'],
    ['718F8A', 'Gumbo', '008000'],
    ['484753', 'Gun Powder', 'EE82EE'],
    ['2C3539', 'Gunmetal', '0000FF'],
    ['7A7C76', 'Gunsmoke', '808080'],
    ['989171', 'Gurkha', '008000'],
    ['9E8022', 'Hacienda', 'FFFF00'],
    ['633528', 'Hairy Heath', 'A52A2A'],
    ['2C2A35', 'Haiti', 'EE82EE'],
    ['EDE7C8', 'Half And Half', '008000'],
    ['558F93', 'Half Baked', '0000FF'],
    ['F2E5BF', 'Half Colonial White', 'FFFF00'],
    ['FBF0D6', 'Half Dutch White', 'FFFF00'],
    ['F1EAD7', 'Half Pearl Lusta', 'FFFF00'],
    ['E6DBC7', 'Half Spanish White', 'FFFF00'],
    ['E8D4A2', 'Hampton', 'FFFF00'],
    ['5218FA', 'Han Purple', 'EE82EE'],
    ['3FFF00', 'Harlequin', '008000'],
    ['C93413', 'Harley Davidson Orange', 'FFA500'],
    ['CBCEC0', 'Harp', '008000'],
    ['EAB76A', 'Harvest Gold', 'FFFF00'],
    ['3B2B2C', 'Havana', 'A52A2A'],
    ['5784C1', 'Havelock Blue', '0000FF'],
    ['99522B', 'Hawaiian Tan', 'FFA500'],
    ['D2DAED', 'Hawkes Blue', '0000FF'],
    ['4F2A2C', 'Heath', 'FF0000'],
    ['AEBBC1', 'Heather', '0000FF'],
    ['948C7E', 'Heathered Grey', 'A52A2A'],
    ['46473E', 'Heavy Metal', '808080'],
    ['DF73FF', 'Heliotrope', 'EE82EE'],
    ['69684B', 'Hemlock', 'FFFF00'],
    ['987D73', 'Hemp', 'A52A2A'],
    ['928C3C', 'Highball', '008000'],
    ['7A9461', 'Highland', '008000'],
    ['A7A07E', 'Hillary', '008000'],
    ['736330', 'Himalaya', 'FFFF00'],
    ['DFF1D6', 'Hint Of Green', '008000'],
    ['F5EFEB', 'Hint Of Red', '808080'],
    ['F6F5D7', 'Hint Of Yellow', '008000'],
    ['49889A', 'Hippie Blue', '0000FF'],
    ['608A5A', 'Hippie Green', '008000'],
    ['AB495C', 'Hippie Pink', 'FF0000'],
    ['A1A9A8', 'Hit Grey', '808080'],
    ['FDA470', 'Hit Pink', 'FFA500'],
    ['BB8E34', 'Hokey Pokey', 'FFFF00'],
    ['647D86', 'Hoki', '0000FF'],
    ['25342B', 'Holly', '008000'],
    ['F400A1', 'Hollywood Cerise', 'FF0000'],
    ['5C3C6D', 'Honey Flower', 'EE82EE'],
    ['F0FFF0', 'Honeydew', 'FFFFFF', 'honeydew'],
    ['E8ED69', 'Honeysuckle', '008000'],
    ['CD6D93', 'Hopbush', 'EE82EE'],
    ['648894', 'Horizon', '0000FF'],
    ['6D562C', 'Horses Neck', 'FFFF00'],
    ['815B28', 'Hot Curry', 'FFFF00'],
    ['FF00CC', 'Hot Magenta', 'FF0000'],
    ['FF69B4', 'Hot Pink', 'FF0000', 'hotpink'],
    ['4E2E53', 'Hot Purple', 'EE82EE'],
    ['A7752C', 'Hot Toddy', 'FFFF00'],
    ['CEEFE4', 'Humming Bird', '008000'],
    ['355E3B', 'Hunter Green', '008000'],
    ['8B7E77', 'Hurricane', 'A52A2A'],
    ['B2994B', 'Husk', 'FFFF00'],
    ['AFE3D6', 'Ice Cold', '008000'],
    ['CAE1D9', 'Iceberg', '008000'],
    ['EF95AE', 'Illusion', 'FF0000'],
    ['B0E313', 'Inch Worm', '008000'],
    ['CD5C5C', 'Indian Red', 'FF0000', 'indianred'],
    ['4F301F', 'Indian Tan', 'A52A2A'],
    ['4B0082', 'Indigo', 'EE82EE', 'indigo'],
    ['9C5B34', 'Indochine', 'FFA500'],
    ['002FA7', 'International Klein Blue', '0000FF'],
    ['FF4F00', 'International Orange', 'FFA500'],
    ['03B4C8', 'Iris Blue', '0000FF'],
    ['62422B', 'Irish Coffee', 'A52A2A'],
    ['CBCDCD', 'Iron', '808080'],
    ['706E66', 'Ironside Grey', '808080'],
    ['865040', 'Ironstone', 'A52A2A'],
    ['009900', 'Islamic Green', '008000'],
    ['F8EDDB', 'Island Spice', 'FFFF00'],
    ['FFFFF0', 'Ivory', 'FFFFFF', 'ivory'],
    ['3D325D', 'Jacarta', 'EE82EE'],
    ['413628', 'Jacko Bean', 'A52A2A'],
    ['3D3F7D', 'Jacksons Purple', 'EE82EE'],
    ['00A86B', 'Jade', '008000'],
    ['E27945', 'Jaffa', 'FFA500'],
    ['CAE7E2', 'Jagged Ice', '008000'],
    ['3F2E4C', 'Jagger', 'EE82EE'],
    ['29292F', 'Jaguar', '0000FF'],
    ['674834', 'Jambalaya', 'A52A2A'],
    ['2F7532', 'Japanese Laurel', '008000'],
    ['CE7259', 'Japonica', 'FFA500'],
    ['259797', 'Java', '008000'],
    ['5F2C2F', 'Jazz', 'FF0000'],
    ['A50B5E', 'Jazzberry Jam', 'EE82EE'],
    ['44798E', 'Jelly Bean', '0000FF'],
    ['BBD0C9', 'Jet Stream', '008000'],
    ['136843', 'Jewel', '008000'],
    ['463D3E', 'Jon', '808080'],
    ['EEF293', 'Jonquil', '008000'],
    ['7AAAE0', 'Jordy Blue', '0000FF'],
    ['5D5346', 'Judge Grey', 'A52A2A'],
    ['878785', 'Jumbo', '808080'],
    ['29AB87', 'Jungle Green', '008000'],
    ['B0C4C4', 'Jungle Mist', '008000'],
    ['74918E', 'Juniper', '008000'],
    ['DCBFAC', 'Just Right', 'FFA500'],
    ['6C5E53', 'Kabul', 'A52A2A'],
    ['245336', 'Kaitoke Green', '008000'],
    ['C5C3B0', 'Kangaroo', '008000'],
    ['2D2D24', 'Karaka', '008000'],
    ['FEDCC1', 'Karry', 'FFA500'],
    ['576D8E', 'Kashmir Blue', '0000FF'],
    ['4CBB17', 'Kelly Green', '008000'],
    ['4D503C', 'Kelp', '008000'],
    ['6C322E', 'Kenyan Copper', 'FF0000'],
    ['5FB69C', 'Keppel', '008000'],
    ['F0E68C', 'Khaki', 'FFFF00', 'khaki'],
    ['BFC0AB', 'Kidnapper', '008000'],
    ['3A3532', 'Kilamanjaro', '808080'],
    ['49764F', 'Killarney', '008000'],
    ['695D87', 'Kimberly', 'EE82EE'],
    ['583580', 'Kingfisher Daisy', 'EE82EE'],
    ['E093AB', 'Kobi', 'FF0000'],
    ['7B785A', 'Kokoda', '008000'],
    ['804E2C', 'Korma', 'FFA500'],
    ['FEB552', 'Koromiko', 'FFFF00'],
    ['F9D054', 'Kournikova', 'FFFF00'],
    ['428929', 'La Palma', '008000'],
    ['BAC00E', 'La Rioja', '008000'],
    ['C6DA36', 'Las Palmas', '008000'],
    ['C6A95E', 'Laser', 'FFFF00'],
    ['FFFF66', 'Laser Lemon', 'FFFF00'],
    ['6E8D71', 'Laurel', '008000'],
    ['E6E6FA', 'Lavender', 'EE82EE', 'lavender'],
    ['CCCCFF', 'Lavender Blue', '0000FF'],
    ['FFF0F5', 'Lavender Blush', 'EE82EE', 'lavenderblush'],
    ['BDBBD7', 'Lavender Grey', '808080'],
    ['FBAED2', 'Lavender Pink', 'FF0000'],
    ['FBA0E3', 'Lavender Rose', 'FF0000'],
    ['7CFC00', 'Lawn Green', '008000', 'lawngreen'],
    ['906A54', 'Leather', 'A52A2A'],
    ['FDE910', 'Lemon', 'FFFF00'],
    ['FFFACD', 'Lemon Chiffon', 'FFFF00', 'lemonchiffon'],
    ['968428', 'Lemon Ginger', 'FFFF00'],
    ['999A86', 'Lemon Grass', '008000'],
    ['2E3749', 'Licorice', '0000FF'],
    ['ADD8E6', 'Light Blue', '0000FF', 'lightblue'],
    ['F08080', 'Light Coral', 'FFA500', 'lightcoral'],
    ['E0FFFF', 'Light Cyan', '0000FF', 'lightcyan'],
    ['EEDD82', 'Light Goldenrod', 'FFFF00'],
    ['FAFAD2', 'Light Goldenrod Yellow', 'FFFF00', 'lightgoldenrodyellow'],
    ['90EE90', 'Light Green', '008000', 'lightgreen'],
    ['D3D3D3', 'Light Grey', '808080', 'lightgrey'],
    ['FFB6C1', 'Light Pink', 'FF0000', 'lightpink'],
    ['FFA07A', 'Light Salmon', 'FFA500', 'lightsalmon'],
    ['20B2AA', 'Light Sea Green', '008000', 'lightseagreen'],
    ['87CEFA', 'Light Sky Blue', '0000FF', 'lightskyblue'],
    ['8470FF', 'Light Slate Blue', '0000FF'],
    ['778899', 'Light Slate Grey', '808080', 'lightslategray'],
    ['B0C4DE', 'Light Steel Blue', '0000FF', 'lightsteelblue'],
    ['856363', 'Light Wood', 'A52A2A'],
    ['FFFFE0', 'Light Yellow', 'FFFF00', 'lightyellow'],
    ['F7A233', 'Lightning Yellow', 'FFFF00'],
    ['C8A2C8', 'Lilac', 'EE82EE'],
    ['9470C4', 'Lilac Bush', 'EE82EE'],
    ['C19FB3', 'Lily', 'EE82EE'],
    ['E9EEEB', 'Lily White', '808080'],
    ['7AAC21', 'Lima', '008000'],
    ['00FF00', 'Lime', '008000', 'lime'],
    ['32CD32', 'Lime Green', '008000', 'limegreen'],
    ['5F9727', 'Limeade', '008000'],
    ['89AC27', 'Limerick', '008000'],
    ['FAF0E6', 'Linen', 'FFFFFF', 'linen'],
    ['C7CDD8', 'Link Water', '0000FF'],
    ['962C54', 'Lipstick', 'FF0000'],
    ['534B4F', 'Liver', 'A52A2A'],
    ['312A29', 'Livid Brown', 'A52A2A'],
    ['DBD9C2', 'Loafer', '008000'],
    ['B3BBB7', 'Loblolly', '008000'],
    ['489084', 'Lochinvar', '008000'],
    ['316EA0', 'Lochmara', '0000FF'],
    ['A2A580', 'Locust', '008000'],
    ['393E2E', 'Log Cabin', '008000'],
    ['9D9CB4', 'Logan', '0000FF'],
    ['B9ACBB', 'Lola', 'EE82EE'],
    ['AE94AB', 'London Hue', 'EE82EE'],
    ['522426', 'Lonestar', 'FF0000'],
    ['8B504B', 'Lotus', 'A52A2A'],
    ['4C3347', 'Loulou', 'EE82EE'],
    ['AB9A1C', 'Lucky', '008000'],
    ['292D4F', 'Lucky Point', '0000FF'],
    ['4E5541', 'Lunar Green', '008000'],
    ['782E2C', 'Lusty', 'FF0000'],
    ['AB8D3F', 'Luxor Gold', 'FFFF00'],
    ['697D89', 'Lynch', '0000FF'],
    ['CBE8E8', 'Mabel', '0000FF'],
    ['FFB97B', 'Macaroni And Cheese', 'FFA500'],
    ['B7E3A8', 'Madang', '008000'],
    ['2D3C54', 'Madison', '0000FF'],
    ['473E23', 'Madras', 'A52A2A'],
    ['FF00FF', 'Magenta', 'EE82EE', 'magenta'],
    ['AAF0D1', 'Magic Mint', '008000'],
    ['F8F4FF', 'Magnolia', 'FFFFFF'],
    ['CA3435', 'Mahogany', 'A52A2A'],
    ['A56531', 'Mai Tai', 'FFA500'],
    ['2A2922', 'Maire', 'FFFF00'],
    ['E3B982', 'Maize', 'FFFF00'],
    ['695F50', 'Makara', 'A52A2A'],
    ['505555', 'Mako', '808080'],
    ['0BDA51', 'Malachite', '008000'],
    ['97976F', 'Malachite Green', '008000'],
    ['66B7E1', 'Malibu', '0000FF'],
    ['3A4531', 'Mallard', '008000'],
    ['A59784', 'Malta', 'A52A2A'],
    ['766D7C', 'Mamba', 'EE82EE'],
    ['8D90A1', 'Manatee', '0000FF'],
    ['B57B2E', 'Mandalay', 'FFFF00'],
    ['8E2323', 'Mandarian Orange', 'FFA500'],
    ['CD525B', 'Mandy', 'FF0000'],
    ['F5B799', 'Mandys Pink', 'FFA500'],
    ['E77200', 'Mango Tango', 'FFA500'],
    ['E2AF80', 'Manhattan', 'FFA500'],
    ['7FC15C', 'Mantis', '008000'],
    ['96A793', 'Mantle', '008000'],
    ['E4DB55', 'Manz', '008000'],
    ['352235', 'Mardi Gras', 'EE82EE'],
    ['B88A3D', 'Marigold', 'FFFF00'],
    ['42639F', 'Mariner', '0000FF'],
    ['800000', 'Maroon', 'A52A2A', 'maroon'],
    ['2B2E26', 'Marshland', '008000'],
    ['B7A8A3', 'Martini', 'A52A2A'],
    ['3C3748', 'Martinique', 'EE82EE'],
    ['EBC881', 'Marzipan', 'FFFF00'],
    ['57534B', 'Masala', 'A52A2A'],
    ['365C7D', 'Matisse', '0000FF'],
    ['8E4D45', 'Matrix', 'FF0000'],
    ['524B4B', 'Matterhorn', '808080'],
    ['E0B0FF', 'Mauve', 'EE82EE'],
    ['915F6D', 'Mauve Taupe', 'FF0000'],
    ['F091A9', 'Mauvelous', 'FF0000'],
    ['C8B1C0', 'Maverick', 'EE82EE'],
    ['73C2FB', 'Maya Blue', '0000FF'],
    ['8C6338', 'McKenzie', 'FFA500'],
    ['66CDAA', 'Medium Aquamarine', '0000FF', 'mediumaquamarine'],
    ['0000CD', 'Medium Blue', '0000FF', 'mediumblue'],
    ['AF4035', 'Medium Carmine', 'FF0000'],
    ['EAEAAE', 'Medium Goldenrod', 'FFFF00'],
    ['BA55D3', 'Medium Orchid', 'EE82EE', 'mediumorchid'],
    ['9370DB', 'Medium Purple', 'EE82EE', 'mediumpurple'],
    ['3CB371', 'Medium Sea Green', '008000', 'mediumseagreen'],
    ['7B68EE', 'Medium Slate Blue', '0000FF', 'mediumslateblue'],
    ['00FA9A', 'Medium Spring Green', '008000', 'mediumspringgreen'],
    ['48D1CC', 'Medium Turquoise', '0000FF', 'mediumturquoise'],
    ['C71585', 'Medium Violet Red', 'FF0000', 'mediumvioletred'],
    ['A68064', 'Medium Wood', 'A52A2A'],
    ['E0B7C2', 'Melanie', 'FF0000'],
    ['342931', 'Melanzane', 'EE82EE'],
    ['FEBAAD', 'Melon', 'FF0000'],
    ['C3B9DD', 'Melrose', 'EE82EE'],
    ['D5D2D1', 'Mercury', '808080'],
    ['E1DBD0', 'Merino', 'FFFF00'],
    ['4F4E48', 'Merlin', '808080'],
    ['73343A', 'Merlot', 'FF0000'],
    ['554A3C', 'Metallic Bronze', 'FF0000'],
    ['6E3D34', 'Metallic Copper', 'FF0000'],
    ['D4AF37', 'Metallic Gold', 'FFFF00'],
    ['BB7431', 'Meteor', 'FFA500'],
    ['4A3B6A', 'Meteorite', 'EE82EE'],
    ['9B3D3D', 'Mexican Red', 'FF0000'],
    ['666A6D', 'Mid Grey', '808080'],
    ['21303E', 'Midnight', '0000FF'],
    ['191970', 'Midnight Blue', '0000FF', 'midnightblue'],
    ['21263A', 'Midnight Express', '0000FF'],
    ['242E28', 'Midnight Moss', '008000'],
    ['3F3623', 'Mikado', 'A52A2A'],
    ['F6F493', 'Milan', '008000'],
    ['9E3332', 'Milano Red', 'FF0000'],
    ['F3E5C0', 'Milk Punch', 'FFFF00'],
    ['DCD9CD', 'Milk White', '808080'],
    ['595648', 'Millbrook', 'A52A2A'],
    ['F5F5CC', 'Mimosa', '008000'],
    ['DAEA6F', 'Mindaro', '008000'],
    ['373E41', 'Mine Shaft', '0000FF'],
    ['506355', 'Mineral Green', '008000'],
    ['407577', 'Ming', '008000'],
    ['3E3267', 'Minsk', 'EE82EE'],
    ['F5FFFA', 'Mint Cream', 'FFFFFF', 'mintcream'],
    ['98FF98', 'Mint Green', '008000'],
    ['E0D8A7', 'Mint Julep', '008000'],
    ['C6EADD', 'Mint Tulip', '008000'],
    ['373F43', 'Mirage', '0000FF'],
    ['A5A9B2', 'Mischka', '0000FF'],
    ['BAB9A9', 'Mist Grey', '808080'],
    ['FFE4E1', 'Misty Rose', 'EE82EE', 'mistyrose'],
    ['605A67', 'Mobster', 'EE82EE'],
    ['582F2B', 'Moccaccino', 'FF0000'],
    ['FFE4B5', 'Moccasin', 'FFFF00', 'moccasin'],
    ['6F372D', 'Mocha', 'FF0000'],
    ['97463C', 'Mojo', 'FF0000'],
    ['FF9889', 'Mona Lisa', 'FF0000'],
    ['6B252C', 'Monarch', 'FF0000'],
    ['554D42', 'Mondo', 'A52A2A'],
    ['A58B6F', 'Mongoose', 'A52A2A'],
    ['7A7679', 'Monsoon', '808080'],
    ['393B3C', 'Montana', '808080'],
    ['7AC5B4', 'Monte Carlo', '008000'],
    ['8378C7', 'Moody Blue', 'EE82EE'],
    ['F5F3CE', 'Moon Glow', '008000'],
    ['CECDB8', 'Moon Mist', '008000'],
    ['C0B2D7', 'Moon Raker', 'EE82EE'],
    ['F0C420', 'Moon Yellow', 'FFFF00'],
    ['9ED1D3', 'Morning Glory', '0000FF'],
    ['442D21', 'Morocco Brown', 'A52A2A'],
    ['565051', 'Mortar', '808080'],
    ['005F5B', 'Mosque', '008000'],
    ['ADDFAD', 'Moss Green', '008000'],
    ['1AB385', 'Mountain Meadow', '008000'],
    ['A09F9C', 'Mountain Mist', '808080'],
    ['997A8D', 'Mountbatten Pink', 'EE82EE'],
    ['A9844F', 'Muddy Waters', 'FFFF00'],
    ['9E7E53', 'Muesli', 'A52A2A'],
    ['C54B8C', 'Mulberry', 'EE82EE'],
    ['884F40', 'Mule Fawn', 'A52A2A'],
    ['524D5B', 'Mulled Wine', 'EE82EE'],
    ['FFDB58', 'Mustard', 'FFFF00'],
    ['D68B80', 'My Pink', 'FF0000'],
    ['FDAE45', 'My Sin', 'FFFF00'],
    ['21421E', 'Myrtle', '008000'],
    ['D8DDDA', 'Mystic', '808080'],
    ['4E5D4E', 'Nandor', '008000'],
    ['A39A87', 'Napa', 'FFFF00'],
    ['E9E6DC', 'Narvik', '008000'],
    ['FFDEAD', 'Navajo White', 'A52A2A', 'navajowhite'],
    ['000080', 'Navy', '0000FF', 'navy'],
    ['0066CC', 'Navy Blue', '0000FF'],
    ['B8C6BE', 'Nebula', '008000'],
    ['EEC7A2', 'Negroni', 'FFA500'],
    ['4D4DFF', 'Neon Blue', '0000FF'],
    ['FF9933', 'Neon Carrot', 'FFA500'],
    ['FF6EC7', 'Neon Pink', 'EE82EE'],
    ['93AAB9', 'Nepal', '0000FF'],
    ['77A8AB', 'Neptune', '008000'],
    ['252525', 'Nero', '808080'],
    ['AAA583', 'Neutral Green', '008000'],
    ['666F6F', 'Nevada', '808080'],
    ['6D3B24', 'New Amber', 'FFA500'],
    ['00009C', 'New Midnight Blue', '0000FF'],
    ['E4C385', 'New Orleans', 'FFFF00'],
    ['EBC79E', 'New Tan', 'A52A2A'],
    ['DD8374', 'New York Pink', 'FF0000'],
    ['29A98B', 'Niagara', '008000'],
    ['332E2E', 'Night Rider', '808080'],
    ['A23D54', 'Night Shadz', 'FF0000'],
    ['253F4E', 'Nile Blue', '0000FF'],
    ['A99D9D', 'Nobel', '808080'],
    ['A19986', 'Nomad', 'FFFF00'],
    ['1D393C', 'Nordic', '0000FF'],
    ['A4B88F', 'Norway', '008000'],
    ['BC9229', 'Nugget', 'FFFF00'],
    ['7E4A3B', 'Nutmeg', 'A52A2A'],
    ['FCEDC5', 'Oasis', 'FFFF00'],
    ['008F70', 'Observatory', '008000'],
    ['4CA973', 'Ocean Green', '008000'],
    ['CC7722', 'Ochre', 'A52A2A'],
    ['DFF0E2', 'Off Green', '008000'],
    ['FAF3DC', 'Off Yellow', 'FFFF00'],
    ['313330', 'Oil', '808080'],
    ['8A3335', 'Old Brick', 'FF0000'],
    ['73503B', 'Old Copper', 'FF0000'],
    ['CFB53B', 'Old Gold', 'FFFF00'],
    ['FDF5E6', 'Old Lace', 'FFFFFF', 'oldlace'],
    ['796878', 'Old Lavender', 'EE82EE'],
    ['C02E4C', 'Old Rose', 'FF0000'],
    ['808000', 'Olive', '008000', 'olive'],
    ['6B8E23', 'Olive Drab', '008000', 'olivedrab'],
    ['B5B35C', 'Olive Green', '008000'],
    ['888064', 'Olive Haze', 'FFFF00'],
    ['747028', 'Olivetone', '008000'],
    ['9AB973', 'Olivine', 'FFA500'],
    ['C2E6EC', 'Onahau', '0000FF'],
    ['48412B', 'Onion', 'FFFF00'],
    ['A8C3BC', 'Opal', '008000'],
    ['987E7E', 'Opium', 'A52A2A'],
    ['395555', 'Oracle', '008000'],
    ['FFA500', 'Orange', 'FFA500', 'orange'],
    ['FFA000', 'Orange Peel', 'FFA500'],
    ['FF4500', 'Orange Red', 'FFA500', 'orangered'],
    ['A85335', 'Orange Roughy', 'FFA500'],
    ['EAE3CD', 'Orange White', 'FFFF00'],
    ['DA70D6', 'Orchid', 'EE82EE', 'orchid'],
    ['F1EBD9', 'Orchid White', 'FFFF00'],
    ['255B77', 'Orient', '0000FF'],
    ['C28E88', 'Oriental Pink', 'FF0000'],
    ['D2D3B3', 'Orinoco', '008000'],
    ['818988', 'Oslo Grey', '808080'],
    ['D3DBCB', 'Ottoman', '008000'],
    ['2D383A', 'Outer Space', '808080'],
    ['FF6037', 'Outrageous Orange', 'FFA500'],
    ['28353A', 'Oxford Blue', '0000FF'],
    ['6D9A78', 'Oxley', '008000'],
    ['D1EAEA', 'Oyster Bay', '0000FF'],
    ['D4B5B0', 'Oyster Pink', 'FF0000'],
    ['864B36', 'Paarl', 'FFA500'],
    ['7A715C', 'Pablo', 'FFFF00'],
    ['009DC4', 'Pacific Blue', '0000FF'],
    ['4F4037', 'Paco', 'A52A2A'],
    ['7EB394', 'Padua', '008000'],
    ['682860', 'Palatinate Purple', 'EE82EE'],
    ['987654', 'Pale Brown', 'A52A2A'],
    ['DDADAF', 'Pale Chestnut', 'FF0000'],
    ['ABCDEF', 'Pale Cornflower Blue', '0000FF'],
    ['EEE8AA', 'Pale Goldenrod', 'FFFF00', 'palegoldenrod'],
    ['98FB98', 'Pale Green', '008000', 'palegreen'],
    ['BDCAA8', 'Pale Leaf', '008000'],
    ['F984E5', 'Pale Magenta', 'EE82EE'],
    ['9C8D72', 'Pale Oyster', 'A52A2A'],
    ['FADADD', 'Pale Pink', 'FF0000'],
    ['F9F59F', 'Pale Prim', '008000'],
    ['EFD6DA', 'Pale Rose', 'FF0000'],
    ['636D70', 'Pale Sky', '0000FF'],
    ['C3BEBB', 'Pale Slate', '808080'],
    ['BC987E', 'Pale Taupe', '808080'],
    ['AFEEEE', 'Pale Turquoise', '0000FF', 'paleturquoise'],
    ['DB7093', 'Pale Violet Red', 'FF0000', 'palevioletred'],
    ['20392C', 'Palm Green', '008000'],
    ['36482F', 'Palm Leaf', '008000'],
    ['EAE4DC', 'Pampas', '808080'],
    ['EBF7E4', 'Panache', '008000'],
    ['DFB992', 'Pancho', 'FFA500'],
    ['544F3A', 'Panda', 'FFFF00'],
    ['FFEFD5', 'Papaya Whip', 'FFFF00', 'papayawhip'],
    ['7C2D37', 'Paprika', 'FF0000'],
    ['488084', 'Paradiso', '008000'],
    ['D0C8B0', 'Parchment', 'FFFF00'],
    ['FBEB50', 'Paris Daisy', '008000'],
    ['312760', 'Paris M', 'EE82EE'],
    ['BFCDC0', 'Paris White', '008000'],
    ['305D35', 'Parsley', '008000'],
    ['77DD77', 'Pastel Green', '008000'],
    ['639283', 'Patina', '008000'],
    ['D3E5EF', 'Pattens Blue', '0000FF'],
    ['2A2551', 'Paua', 'EE82EE'],
    ['BAAB87', 'Pavlova', 'FFFF00'],
    ['404048', 'Payne\'s Grey', '808080'],
    ['FFCBA4', 'Peach', 'FFA500'],
    ['FFDAB9', 'Peach Puff', 'FFFF00', 'peachpuff'],
    ['FFCC99', 'Peach-Orange', 'FFA500'],
    ['FADFAD', 'Peach-Yellow', 'FFFF00'],
    ['7A4434', 'Peanut', 'A52A2A'],
    ['D1E231', 'Pear', 'FFFF00'],
    ['DED1C6', 'Pearl Bush', 'FFA500'],
    ['EAE0C8', 'Pearl Lusta', 'FFFF00'],
    ['766D52', 'Peat', 'FFFF00'],
    ['2599B2', 'Pelorous', '0000FF'],
    ['D7E7D0', 'Peppermint', '008000'],
    ['ACB9E8', 'Perano', '0000FF'],
    ['C2A9DB', 'Perfume', 'EE82EE'],
    ['ACB6B2', 'Periglacial Blue', '008000'],
    ['C3CDE6', 'Periwinkle', '0000FF'],
    ['1C39BB', 'Persian Blue', '0000FF'],
    ['00A693', 'Persian Green', '008000'],
    ['32127A', 'Persian Indigo', 'EE82EE'],
    ['F77FBE', 'Persian Pink', 'FF0000'],
    ['683332', 'Persian Plum', 'FF0000'],
    ['CC3333', 'Persian Red', 'FF0000'],
    ['FE28A2', 'Persian Rose', 'FF0000'],
    ['EC5800', 'Persimmon', 'FF0000'],
    ['CD853F', 'Peru', 'A52A2A', 'peru'],
    ['733D1F', 'Peru Tan', 'FFA500'],
    ['7A7229', 'Pesto', 'FFFF00'],
    ['DA9790', 'Petite Orchid', 'FF0000'],
    ['91A092', 'Pewter', '008000'],
    ['826663', 'Pharlap', 'A52A2A'],
    ['F8EA97', 'Picasso', '008000'],
    ['5BA0D0', 'Picton Blue', '0000FF'],
    ['FDD7E4', 'Pig Pink', 'FF0000'],
    ['00A550', 'Pigment Green', '008000'],
    ['756556', 'Pine Cone', 'A52A2A'],
    ['BDC07E', 'Pine Glade', '008000'],
    ['01796F', 'Pine Green', '008000'],
    ['2A2F23', 'Pine Tree', '008000'],
    ['FFC0CB', 'Pink', 'FF0000', 'pink'],
    ['FF66FF', 'Pink Flamingo', 'FF0000'],
    ['D8B4B6', 'Pink Flare', 'FF0000'],
    ['F6CCD7', 'Pink Lace', 'FF0000'],
    ['F3D7B6', 'Pink Lady', 'FFA500'],
    ['BFB3B2', 'Pink Swan', '808080'],
    ['9D5432', 'Piper', 'FFA500'],
    ['F5E6C4', 'Pipi', 'FFFF00'],
    ['FCDBD2', 'Pippin', 'FF0000'],
    ['BA782A', 'Pirate Gold', 'FFFF00'],
    ['BBCDA5', 'Pixie Green', '008000'],
    ['E57F3D', 'Pizazz', 'FFA500'],
    ['BF8D3C', 'Pizza', 'FFFF00'],
    ['3E594C', 'Plantation', '008000'],
    ['DDA0DD', 'Plum', 'EE82EE', 'plum'],
    ['651C26', 'Pohutukawa', 'FF0000'],
    ['E5F2E7', 'Polar', '008000'],
    ['8AA7CC', 'Polo Blue', '0000FF'],
    ['6A1F44', 'Pompadour', 'EE82EE'],
    ['DDDCDB', 'Porcelain', '808080'],
    ['DF9D5B', 'Porsche', 'FFA500'],
    ['3B436C', 'Port Gore', '0000FF'],
    ['F4F09B', 'Portafino', '008000'],
    ['8B98D8', 'Portage', '0000FF'],
    ['F0D555', 'Portica', 'FFFF00'],
    ['EFDCD4', 'Pot Pourri', 'FFA500'],
    ['845C40', 'Potters Clay', 'A52A2A'],
    ['B0E0E6', 'Powder Blue', '0000FF', 'powderblue'],
    ['883C32', 'Prairie Sand', 'FF0000'],
    ['CAB4D4', 'Prelude', 'EE82EE'],
    ['E2CDD5', 'Prim', 'EE82EE'],
    ['E4DE8E', 'Primrose', '008000'],
    ['F8F6DF', 'Promenade', '008000'],
    ['F6E3DA', 'Provincial Pink', 'FFA500'],
    ['003366', 'Prussian Blue', '0000FF'],
    ['DD00FF', 'Psychedelic Purple', 'EE82EE'],
    ['CC8899', 'Puce', 'FF0000'],
    ['6E3326', 'Pueblo', 'FFA500'],
    ['59BAA3', 'Puerto Rico', '008000'],
    ['BAC0B4', 'Pumice', '008000'],
    ['FF7518', 'Pumpkin', 'FFA500'],
    ['534931', 'Punga', 'FFFF00'],
    ['800080', 'Purple', 'EE82EE', 'purple'],
    ['652DC1', 'Purple Heart', 'EE82EE'],
    ['9678B6', 'Purple Mountain\'s Majesty', 'EE82EE'],
    ['50404D', 'Purple Taupe', '808080'],
    ['CDAE70', 'Putty', 'FFFF00'],
    ['F2EDDD', 'Quarter Pearl Lusta', '008000'],
    ['EBE2D2', 'Quarter Spanish White', 'FFFF00'],
    ['D9D9F3', 'Quartz', 'FFFFFF'],
    ['C3988B', 'Quicksand', 'A52A2A'],
    ['CBC9C0', 'Quill Grey', '808080'],
    ['6A5445', 'Quincy', 'A52A2A'],
    ['232F2C', 'Racing Green', '008000'],
    ['FF355E', 'Radical Red', 'FF0000'],
    ['DCC6A0', 'Raffia', 'FFFF00'],
    ['667028', 'Rain Forest', '008000'],
    ['B3C1B1', 'Rainee', '008000'],
    ['FCAE60', 'Rajah', 'FFA500'],
    ['2B2E25', 'Rangoon Green', '008000'],
    ['6F747B', 'Raven', '0000FF'],
    ['D27D46', 'Raw Sienna', 'A52A2A'],
    ['734A12', 'Raw Umber', 'A52A2A'],
    ['FF33CC', 'Razzle Dazzle Rose', 'FF0000'],
    ['E30B5C', 'Razzmatazz', 'FF0000'],
    ['663399', 'Rebecca Purple', 'EE82EE', 'rebeccapurple'],
    ['453430', 'Rebel', 'A52A2A'],
    ['FF0000', 'Red', 'FF0000', 'red'],
    ['701F28', 'Red Berry', 'FF0000'],
    ['CB6F4A', 'Red Damask', 'FFA500'],
    ['662A2C', 'Red Devil', 'FF0000'],
    ['FF3F34', 'Red Orange', 'FFA500'],
    ['5D1F1E', 'Red Oxide', 'FF0000'],
    ['7D4138', 'Red Robin', 'FF0000'],
    ['AD522E', 'Red Stage', 'FFA500'],
    ['BB3385', 'Medium Red Violet', 'EE82EE'],
    ['5B342E', 'Redwood', 'FF0000'],
    ['D1EF9F', 'Reef', '008000'],
    ['A98D36', 'Reef Gold', 'FFFF00'],
    ['203F58', 'Regal Blue', '0000FF'],
    ['798488', 'Regent Grey', '0000FF'],
    ['A0CDD9', 'Regent St Blue', '0000FF'],
    ['F6DEDA', 'Remy', 'FF0000'],
    ['B26E33', 'Reno Sand', 'FFA500'],
    ['323F75', 'Resolution Blue', '0000FF'],
    ['37363F', 'Revolver', 'EE82EE'],
    ['3D4653', 'Rhino', '0000FF'],
    ['EFECDE', 'Rice Cake', '008000'],
    ['EFF5D1', 'Rice Flower', '008000'],
    ['5959AB', 'Rich Blue', '0000FF'],
    ['A15226', 'Rich Gold', 'FFA500'],
    ['B7C61A', 'Rio Grande', '008000'],
    ['89D9C8', 'Riptide', '008000'],
    ['556061', 'River Bed', '0000FF'],
    ['DDAD56', 'Rob Roy', 'FFFF00'],
    ['00CCCC', 'Robin\'s Egg Blue', '0000FF'],
    ['5A4D41', 'Rock', 'A52A2A'],
    ['93A2BA', 'Rock Blue', '0000FF'],
    ['9D442D', 'Rock Spray', 'FFA500'],
    ['C7A384', 'Rodeo Dust', 'A52A2A'],
    ['6D7876', 'Rolling Stone', '008000'],
    ['D8625B', 'Roman', 'FF0000'],
    ['7D6757', 'Roman Coffee', 'A52A2A'],
    ['F4F0E6', 'Romance', '808080'],
    ['FFC69E', 'Romantic', 'FFA500'],
    ['EAB852', 'Ronchi', 'FFFF00'],
    ['A14743', 'Roof Terracotta', 'FF0000'],
    ['8E593C', 'Rope', 'FFA500'],
    ['D3A194', 'Rose', 'FF0000'],
    ['FEAB9A', 'Rose Bud', 'FF0000'],
    ['8A2D52', 'Rose Bud Cherry', 'FF0000'],
    ['AC512D', 'Rose Of Sharon', 'FFA500'],
    ['905D5D', 'Rose Taupe', 'EE82EE'],
    ['FBEEE8', 'Rose White', 'FF0000'],
    ['BC8F8F', 'Rosy Brown', 'A52A2A', 'rosybrown'],
    ['B69642', 'Roti', 'FFFF00'],
    ['A94064', 'Rouge', 'FF0000'],
    ['4169E1', 'Royal Blue', '0000FF', 'royalblue'],
    ['B54B73', 'Royal Heath', 'FF0000'],
    ['6B3FA0', 'Royal Purple', 'EE82EE'],
    ['E0115F', 'Ruby', 'FF0000'],
    ['716675', 'Rum', 'EE82EE'],
    ['F1EDD4', 'Rum Swizzle', '008000'],
    ['80461B', 'Russet', 'A52A2A'],
    ['7D655C', 'Russett', 'A52A2A'],
    ['B7410E', 'Rust', 'FF0000'],
    ['3A181A', 'Rustic Red', 'FF0000'],
    ['8D5F2C', 'Rusty Nail', 'FFA500'],
    ['5D4E46', 'Saddle', 'A52A2A'],
    ['8B4513', 'Saddle Brown', 'A52A2A', 'saddlebrown'],
    ['FF6600', 'Safety Orange', 'FFA500'],
    ['F4C430', 'Saffron', 'FFFF00'],
    ['989F7A', 'Sage', '008000'],
    ['B79826', 'Sahara', 'FFFF00'],
    ['A5CEEC', 'Sail', '0000FF'],
    ['177B4D', 'Salem', '008000'],
    ['FA8072', 'Salmon', 'FF0000', 'salmon'],
    ['FFD67B', 'Salomie', 'FFFF00'],
    ['696268', 'Salt Box', 'EE82EE'],
    ['EEF3E5', 'Saltpan', '808080'],
    ['3B2E25', 'Sambuca', 'A52A2A'],
    ['2C6E31', 'San Felix', '008000'],
    ['445761', 'San Juan', '0000FF'],
    ['4E6C9D', 'San Marino', '0000FF'],
    ['867665', 'Sand Dune', 'A52A2A'],
    ['A3876A', 'Sandal', 'A52A2A'],
    ['AF937D', 'Sandrift', 'A52A2A'],
    ['786D5F', 'Sandstone', 'A52A2A'],
    ['DECB81', 'Sandwisp', 'FFFF00'],
    ['FEDBB7', 'Sandy Beach', 'FFA500'],
    ['F4A460', 'Sandy Brown', 'A52A2A', 'sandybrown'],
    ['92000A', 'Sangria', 'FF0000'],
    ['6C3736', 'Sanguine Brown', 'FF0000'],
    ['9998A7', 'Santas Grey', '0000FF'],
    ['A96A50', 'Sante Fe', 'FFA500'],
    ['E1D5A6', 'Sapling', 'FFFF00'],
    ['082567', 'Sapphire', '0000FF'],
    ['555B2C', 'Saratoga', '008000'],
    ['F4EAE4', 'Sauvignon', 'FF0000'],
    ['F5DEC4', 'Sazerac', 'FFA500'],
    ['6F63A0', 'Scampi', 'EE82EE'],
    ['ADD9D1', 'Scandal', '008000'],
    ['FF2400', 'Scarlet', 'FF0000'],
    ['4A2D57', 'Scarlet Gum', 'EE82EE'],
    ['7E2530', 'Scarlett', 'FF0000'],
    ['6B6A6C', 'Scarpa Flow', '808080'],
    ['87876F', 'Schist', '008000'],
    ['FFD800', 'School Bus Yellow', 'FFFF00'],
    ['8D8478', 'Schooner', 'A52A2A'],
    ['308EA0', 'Scooter', '0000FF'],
    ['6A6466', 'Scorpion', '808080'],
    ['EEE7C8', 'Scotch Mist', 'FFFF00'],
    ['66FF66', 'Screamin\' Green', '008000'],
    ['3D4031', 'Scrub', '008000'],
    ['EF9548', 'Sea Buckthorn', 'FFA500'],
    ['DFDDD6', 'Sea Fog', '808080'],
    ['2E8B57', 'Sea Green', '008000', 'seagreen'],
    ['C2D5C4', 'Sea Mist', '008000'],
    ['8AAEA4', 'Sea Nymph', '008000'],
    ['DB817E', 'Sea Pink', 'FF0000'],
    ['77B7D0', 'Seagull', '0000FF'],
    ['321414', 'Seal Brown', 'A52A2A'],
    ['69326E', 'Seance', 'EE82EE'],
    ['FFF5EE', 'Seashell', 'FFFFFF', 'seashell'],
    ['37412A', 'Seaweed', '008000'],
    ['E6DFE7', 'Selago', 'EE82EE'],
    ['FFBA00', 'Selective Yellow', 'FFFF00'],
    ['6B4226', 'Semi-Sweet Chocolate', 'A52A2A'],
    ['9E5B40', 'Sepia', 'A52A2A'],
    ['FCE9D7', 'Serenade', 'FFA500'],
    ['837050', 'Shadow', '008000'],
    ['9AC0B6', 'Shadow Green', '008000'],
    ['9F9B9D', 'Shady Lady', '808080'],
    ['609AB8', 'Shakespeare', '0000FF'],
    ['F8F6A8', 'Shalimar', '008000'],
    ['33CC99', 'Shamrock', '008000'],
    ['009E60', 'Shamrock Green', '008000'],
    ['34363A', 'Shark', '808080'],
    ['00494E', 'Sherpa Blue', '008000'],
    ['1B4636', 'Sherwood Green', '008000'],
    ['E6B2A6', 'Shilo', 'FF0000'],
    ['745937', 'Shingle Fawn', 'A52A2A'],
    ['7988AB', 'Ship Cove', '0000FF'],
    ['4E4E4C', 'Ship Grey', '808080'],
    ['842833', 'Shiraz', 'FF0000'],
    ['E899BE', 'Shocking', 'EE82EE'],
    ['FC0FC0', 'Shocking Pink', 'FF0000'],
    ['61666B', 'Shuttle Grey', '808080'],
    ['686B50', 'Siam', '008000'],
    ['E9D9A9', 'Sidecar', 'FFFF00'],
    ['A0522D', 'Sienna', 'A52A2A', 'sienna'],
    ['BBADA1', 'Silk', 'A52A2A'],
    ['C0C0C0', 'Silver', '808080', 'silver'],
    ['ACAEA9', 'Silver Chalice', '808080'],
    ['BEBDB6', 'Silver Sand', '808080'],
    ['67BE90', 'Silver Tree', '008000'],
    ['A6D5D0', 'Sinbad', '008000'],
    ['69293B', 'Siren', 'FF0000'],
    ['68766E', 'Sirocco', '008000'],
    ['C5BAA0', 'Sisal', 'FFFF00'],
    ['9DB4AA', 'Skeptic', '008000'],
    ['87CEEB', 'Sky Blue', '0000FF', 'skyblue'],
    ['6A5ACD', 'Slate Blue', '0000FF', 'slateblue'],
    ['708090', 'Slate Grey', '808080', 'slategray'],
    ['42342B', 'Slugger', 'A52A2A'],
    ['003399', 'Smalt', '0000FF'],
    ['496267', 'Smalt Blue', '0000FF'],
    ['BB5F34', 'Smoke Tree', 'FFA500'],
    ['605D6B', 'Smoky', 'EE82EE'],
    ['FFFAFA', 'Snow', 'FFFFFF', 'snow'],
    ['E3E3DC', 'Snow Drift', '808080'],
    ['EAF7C9', 'Snow Flurry', '008000'],
    ['D6F0CD', 'Snowy Mint', '008000'],
    ['E4D7E5', 'Snuff', 'EE82EE'],
    ['ECE5DA', 'Soapstone', '808080'],
    ['CFBEA5', 'Soft Amber', 'FFFF00'],
    ['EEDFDE', 'Soft Peach', 'FF0000'],
    ['85494C', 'Solid Pink', 'FF0000'],
    ['EADAC2', 'Solitaire', 'FFFF00'],
    ['E9ECF1', 'Solitude', '0000FF'],
    ['DD6B38', 'Sorbus', 'FFA500'],
    ['9D7F61', 'Sorrell Brown', 'A52A2A'],
    ['C9B59A', 'Sour Dough', 'A52A2A'],
    ['6F634B', 'Soya Bean', 'A52A2A'],
    ['4B433B', 'Space Shuttle', 'A52A2A'],
    ['7B8976', 'Spanish Green', '008000'],
    ['DED1B7', 'Spanish White', 'FFFF00'],
    ['375D4F', 'Spectra', '008000'],
    ['6C4F3F', 'Spice', 'A52A2A'],
    ['8B5F4D', 'Spicy Mix', 'A52A2A'],
    ['FF1CAE', 'Spicy Pink', 'FF0000'],
    ['B3C4D8', 'Spindle', '0000FF'],
    ['F1D79E', 'Splash', 'FFFF00'],
    ['7ECDDD', 'Spray', '0000FF'],
    ['A7FC00', 'Spring Bud', '008000'],
    ['00FF7F', 'Spring Green', '008000', 'springgreen'],
    ['A3BD9C', 'Spring Rain', '008000'],
    ['F1F1C6', 'Spring Sun', '008000'],
    ['E9E1D9', 'Spring Wood', '808080'],
    ['B8CA9D', 'Sprout', '008000'],
    ['A2A1AC', 'Spun Pearl', '0000FF'],
    ['8F7D6B', 'Squirrel', 'A52A2A'],
    ['325482', 'St Tropaz', '0000FF'],
    ['858885', 'Stack', '808080'],
    ['A0A197', 'Star Dust', '808080'],
    ['D2C6B6', 'Stark White', 'FFFF00'],
    ['E3DD39', 'Starship', '008000'],
    ['4682B4', 'Steel Blue', '0000FF', 'steelblue'],
    ['43464B', 'Steel Grey', '808080'],
    ['833D3E', 'Stiletto', 'FF0000'],
    ['807661', 'Stonewall', 'FFFF00'],
    ['65645F', 'Storm Dust', '808080'],
    ['747880', 'Storm Grey', '0000FF'],
    ['DABE82', 'Straw', 'FFFF00'],
    ['946A81', 'Strikemaster', 'EE82EE'],
    ['406356', 'Stromboli', '008000'],
    ['724AA1', 'Studio', 'EE82EE'],
    ['8C9C9C', 'Submarine', '0000FF'],
    ['EEEFDF', 'Sugar Cane', '008000'],
    ['C6EA80', 'Sulu', '008000'],
    ['8FB69C', 'Summer Green', '008000'],
    ['38B0DE', 'Summer Sky', '0000FF'],
    ['EF8E38', 'Sun', 'FFA500'],
    ['C4AA4D', 'Sundance', 'FFFF00'],
    ['F8AFA9', 'Sundown', 'FF0000'],
    ['DAC01A', 'Sunflower', 'FFFF00'],
    ['C76155', 'Sunglo', 'FF0000'],
    ['FFCC33', 'Sunglow', 'FFA500'],
    ['C0514A', 'Sunset', 'FF0000'],
    ['FE4C40', 'Sunset Orange', 'FFA500'],
    ['FA9D49', 'Sunshade', 'FFA500'],
    ['FFB437', 'Supernova', 'FFFF00'],
    ['B8D4BB', 'Surf', '008000'],
    ['C3D6BD', 'Surf Crest', '008000'],
    ['007B77', 'Surfie Green', '008000'],
    ['7C9F2F', 'Sushi', '008000'],
    ['8B8685', 'Suva Grey', '808080'],
    ['252F2F', 'Swamp', '008000'],
    ['DAE6DD', 'Swans Down', '808080'],
    ['F9E176', 'Sweet Corn', 'FFFF00'],
    ['EE918D', 'Sweet Pink', 'FF0000'],
    ['D7CEC5', 'Swirl', '808080'],
    ['DBD0CA', 'Swiss Coffee', '808080'],
    ['F6AE78', 'Tacao', 'FFA500'],
    ['D2B960', 'Tacha', 'FFFF00'],
    ['DC722A', 'Tahiti Gold', 'FFA500'],
    ['D8CC9B', 'Tahuna Sands', 'FFFF00'],
    ['853534', 'Tall Poppy', 'FF0000'],
    ['A39977', 'Tallow', 'FFFF00'],
    ['752B2F', 'Tamarillo', 'FF0000'],
    ['D2B48C', 'Tan', 'A52A2A', 'tan'],
    ['B8B5A1', 'Tana', '008000'],
    ['1E2F3C', 'Tangaroa', '0000FF'],
    ['F28500', 'Tangerine', 'FFA500'],
    ['FFCC00', 'Tangerine Yellow', 'FFFF00'],
    ['D46F31', 'Tango', 'FFA500'],
    ['7C7C72', 'Tapa', '008000'],
    ['B37084', 'Tapestry', 'FF0000'],
    ['DEF1DD', 'Tara', '008000'],
    ['253C48', 'Tarawera', '0000FF'],
    ['BAC0B3', 'Tasman', '808080'],
    ['483C32', 'Taupe', '808080'],
    ['8B8589', 'Taupe Grey', '808080'],
    ['643A48', 'Tawny Port', 'FF0000'],
    ['496569', 'Tax Break', '0000FF'],
    ['2B4B40', 'Te Papa Green', '008000'],
    ['BFB5A2', 'Tea', 'FFFF00'],
    ['D0F0C0', 'Tea Green', '008000'],
    ['F883C2', 'Tea Rose', 'FFA500'],
    ['AB8953', 'Teak', 'FFFF00'],
    ['008080', 'Teal', '0000FF', 'teal'],
    ['254855', 'Teal Blue', '0000FF'],
    ['3C2126', 'Temptress', 'A52A2A'],
    ['CD5700', 'Tenne (Tawny)', 'FFA500'],
    ['F4D0A4', 'Tequila', 'FFFF00'],
    ['E2725B', 'Terra Cotta', 'FF0000'],
    ['ECE67E', 'Texas', '008000'],
    ['FCB057', 'Texas Rose', 'FFA500'],
    ['B1948F', 'Thatch', 'A52A2A'],
    ['544E31', 'Thatch Green', 'FFFF00'],
    ['D8BFD8', 'Thistle', 'EE82EE', 'thistle'],
    ['4D4D4B', 'Thunder', '808080'],
    ['923830', 'Thunderbird', 'FF0000'],
    ['97422D', 'Tia Maria', 'FFA500'],
    ['B9C3BE', 'Tiara', '808080'],
    ['184343', 'Tiber', '008000'],
    ['FC80A5', 'Tickle Me Pink', 'FF0000'],
    ['F0F590', 'Tidal', '008000'],
    ['BEB4AB', 'Tide', 'A52A2A'],
    ['324336', 'Timber Green', '008000'],
    ['D9D6CF', 'Timberwolf', '808080'],
    ['DDD6E1', 'Titan White', 'EE82EE'],
    ['9F715F', 'Toast', 'A52A2A'],
    ['6D5843', 'Tobacco Brown', 'A52A2A'],
    ['44362D', 'Tobago', 'A52A2A'],
    ['3E2631', 'Toledo', 'EE82EE'],
    ['2D2541', 'Tolopea', 'EE82EE'],
    ['4F6348', 'Tom Thumb', '008000'],
    ['FF6347', 'Tomato', 'FF0000', 'tomato'],
    ['E79E88', 'Tonys Pink', 'FFA500'],
    ['817C87', 'Topaz', 'EE82EE'],
    ['FD0E35', 'Torch Red', 'FF0000'],
    ['353D75', 'Torea Bay', '0000FF'],
    ['374E88', 'Tory Blue', '0000FF'],
    ['744042', 'Tosca', 'FF0000'],
    ['9CACA5', 'Tower Grey', '008000'],
    ['6DAFA7', 'Tradewind', '008000'],
    ['DDEDE9', 'Tranquil', '0000FF'],
    ['E2DDC7', 'Travertine', '008000'],
    ['E2813B', 'Tree Poppy', 'FFA500'],
    ['7E8424', 'Trendy Green', '008000'],
    ['805D80', 'Trendy Pink', 'EE82EE'],
    ['C54F33', 'Trinidad', 'FFA500'],
    ['AEC9EB', 'Tropical Blue', '0000FF'],
    ['00755E', 'Tropical Rain Forest', '008000'],
    ['4C5356', 'Trout', '808080'],
    ['8E72C7', 'True V', 'EE82EE'],
    ['454642', 'Tuatara', '808080'],
    ['F9D3BE', 'Tuft Bush', 'FFA500'],
    ['E3AC3D', 'Tulip Tree', 'FFFF00'],
    ['DEA681', 'Tumbleweed', 'A52A2A'],
    ['46494E', 'Tuna', '808080'],
    ['585452', 'Tundora', '808080'],
    ['F5CC23', 'Turbo', 'FFFF00'],
    ['A56E75', 'Turkish Rose', 'FF0000'],
    ['AE9041', 'Turmeric', 'FFFF00'],
    ['40E0D0', 'Turquoise', '0000FF', 'turquoise'],
    ['6CDAE7', 'Turquoise Blue', '0000FF'],
    ['363E1D', 'Turtle Green', '008000'],
    ['AD6242', 'Tuscany', 'FFA500'],
    ['E3E5B1', 'Tusk', '008000'],
    ['BF914B', 'Tussock', 'FFFF00'],
    ['F8E4E3', 'Tutu', 'FF0000'],
    ['DAC0CD', 'Twilight', 'EE82EE'],
    ['F4F6EC', 'Twilight Blue', '808080'],
    ['C19156', 'Twine', 'FFFF00'],
    ['66023C', 'Tyrian Purple', 'EE82EE'],
    ['FF6FFF', 'Ultra Pink', 'FF0000'],
    ['120A8F', 'Ultramarine', '0000FF'],
    ['D4574E', 'Valencia', 'FF0000'],
    ['382C38', 'Valentino', 'EE82EE'],
    ['2A2B41', 'Valhalla', 'EE82EE'],
    ['523936', 'Van Cleef', 'A52A2A'],
    ['CCB69B', 'Vanilla', 'A52A2A'],
    ['EBD2D1', 'Vanilla Ice', 'FF0000'],
    ['FDEFD3', 'Varden', 'FFFF00'],
    ['C80815', 'Venetian Red', 'FF0000'],
    ['2C5778', 'Venice Blue', '0000FF'],
    ['8B7D82', 'Venus', 'EE82EE'],
    ['62603E', 'Verdigris', '808080'],
    ['48531A', 'Verdun Green', '008000'],
    ['FF4D00', 'Vermilion', 'FF0000'],
    ['5C4033', 'Very Dark Brown', 'A52A2A'],
    ['CDCDCD', 'Very Light Grey', '808080'],
    ['A85533', 'Vesuvius', 'FFA500'],
    ['564985', 'Victoria', 'EE82EE'],
    ['5F9228', 'Vida Loca', '008000'],
    ['4DB1C8', 'Viking', '0000FF'],
    ['955264', 'Vin Rouge', 'FF0000'],
    ['C58F9D', 'Viola', 'FF0000'],
    ['2E2249', 'Violent Violet', 'EE82EE'],
    ['EE82EE', 'Violet', 'EE82EE', 'violet'],
    ['9F5F9F', 'Violet Blue', 'EE82EE'],
    ['F7468A', 'Violet Red', 'FF0000'],
    ['40826D', 'Viridian', '0000FF'],
    ['4B5F56', 'Viridian Green', '008000'],
    ['F9E496', 'Vis Vis', 'FFFF00'],
    ['97D5B3', 'Vista Blue', '008000'],
    ['E3DFD9', 'Vista White', '808080'],
    ['FF9980', 'Vivid Tangerine', 'FFA500'],
    ['803790', 'Vivid Violet', 'EE82EE'],
    ['4E2728', 'Volcano', 'FF0000'],
    ['443240', 'Voodoo', 'EE82EE'],
    ['36383C', 'Vulcan', '808080'],
    ['D4BBB1', 'Wafer', 'FFA500'],
    ['5B6E91', 'Waikawa Grey', '0000FF'],
    ['4C4E31', 'Waiouru', '008000'],
    ['E4E2DC', 'Wan White', '808080'],
    ['849137', 'Wasabi', '008000'],
    ['B6ECDE', 'Water Leaf', '008000'],
    ['006E4E', 'Watercourse', '008000'],
    ['D6CA3D', 'Wattle', '008000'],
    ['F2CDBB', 'Watusi', 'FFA500'],
    ['EEB39E', 'Wax Flower', 'FFA500'],
    ['FDD7D8', 'We Peep', 'FF0000'],
    ['4C6B88', 'Wedgewood', '0000FF'],
    ['8E3537', 'Well Read', 'FF0000'],
    ['5C512F', 'West Coast', 'FFFF00'],
    ['E5823A', 'West Side', 'FFA500'],
    ['D4CFC5', 'Westar', '808080'],
    ['F1919A', 'Wewak', 'FF0000'],
    ['F5DEB3', 'Wheat', 'A52A2A', 'wheat'],
    ['DFD7BD', 'Wheatfield', 'FFFF00'],
    ['D29062', 'Whiskey', 'FFA500'],
    ['D4915D', 'Whiskey Sour', 'FFA500'],
    ['EFE6E6', 'Whisper', '808080'],
    ['FFFFFF', 'White', 'FFFFFF', 'white'],
    ['D7EEE4', 'White Ice', '008000'],
    ['E7E5E8', 'White Lilac', '0000FF'],
    ['EEE7DC', 'White Linen', '808080'],
    ['F8F6D8', 'White Nectar', '008000'],
    ['DAD6CC', 'White Pointer', '808080'],
    ['D4CFB4', 'White Rock', '008000'],
    ['F5F5F5', 'White Smoke', 'FFFFFF', 'whitesmoke'],
    ['7A89B8', 'Wild Blue Yonder', '0000FF'],
    ['E3D474', 'Wild Rice', '008000'],
    ['E7E4DE', 'Wild Sand', '808080'],
    ['FF3399', 'Wild Strawberry', 'FF0000'],
    ['FD5B78', 'Wild Watermelon', 'FF0000'],
    ['BECA60', 'Wild Willow', '008000'],
    ['53736F', 'William', '008000'],
    ['DFE6CF', 'Willow Brook', '008000'],
    ['69755C', 'Willow Grove', '008000'],
    ['462C77', 'Windsor', 'EE82EE'],
    ['522C35', 'Wine Berry', 'FF0000'],
    ['D0C383', 'Winter Hazel', 'FFFF00'],
    ['F9E8E2', 'Wisp Pink', 'FF0000'],
    ['C9A0DC', 'Wisteria', 'EE82EE'],
    ['A29ECD', 'Wistful', '0000FF'],
    ['FBF073', 'Witch Haze', '008000'],
    ['302621', 'Wood Bark', 'A52A2A'],
    ['463629', 'Woodburn', 'A52A2A'],
    ['626746', 'Woodland', '008000'],
    ['45402B', 'Woodrush', 'FFFF00'],
    ['2B3230', 'Woodsmoke', '808080'],
    ['554545', 'Woody Brown', 'A52A2A'],
    ['75876E', 'Xanadu', '008000'],
    ['FFFF00', 'Yellow', 'FFFF00', 'yellow'],
    ['9ACD32', 'Yellow Green', '008000', 'yellowgreen'],
    ['73633E', 'Yellow Metal', 'FFFF00'],
    ['FFAE42', 'Yellow Orange', 'FFA500'],
    ['F49F35', 'Yellow Sea', 'FFFF00'],
    ['FFC5BB', 'Your Pink', 'FF0000'],
    ['826A21', 'Yukon Gold', 'FFFF00'],
    ['C7B882', 'Yuma', 'FFFF00'],
    ['6B5A5A', 'Zambezi', 'A52A2A'],
    ['B2C6B1', 'Zanah', '008000'],
    ['C6723B', 'Zest', 'FFA500'],
    ['3B3C38', 'Zeus', '808080'],
    ['81A6AA', 'Ziggurat', '0000FF'],
    ['EBC2AF', 'Zinnwaldite', 'A52A2A'],
    ['DEE3E3', 'Zircon', '808080'],
    ['DDC283', 'Zombie', 'FFFF00'],
    ['A29589', 'Zorba', 'A52A2A'],
    ['17462E', 'Zuccini', '008000'],
    ['CDD5D5', 'Zumthor', '808080']
  ]);
  // cSpell:enable
}

// tslint:disable:max-line-length
// cSpell:disable
// Based on: https://www.w3schools.com/colors/colors_names.asp
export const colorNames = {
  aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff', aquamarine: '#7fffd4', azure: '#f0ffff',
  beige: '#f5f5dc', bisque: '#ffe4c4', black: '#000000', blanchedalmond: '#ffebcd', blue: '#0000ff', blueviolet: '#8a2be2', brown: '#a52a2a', burlywood: '#deb887',
  cadetblue: '#5f9ea0', chartreuse: '#7fff00', chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed', cornsilk: '#fff8dc', crimson: '#dc143c', cyan: '#00ffff',
  darkblue: '#00008b', darkcyan: '#008b8b', darkgoldenrod: '#b8860b', darkgray: '#a9a9a9', darkgreen: '#006400', darkkhaki: '#bdb76b', darkmagenta: '#8b008b', darkolivegreen: '#556b2f', darkorange: '#ff8c00', darkorchid: '#9932cc', darkred: '#8b0000', darksalmon: '#e9967a', darkseagreen: '#8fbc8f', darkslateblue: '#483d8b', darkslategray: '#2f4f4f', darkturquoise: '#00ced1', darkviolet: '#9400d3',
  deeppink: '#ff1493', deepskyblue: '#00bfff', dimgray: '#696969', dodgerblue: '#1e90ff',
  firebrick: '#b22222', floralwhite: '#fffaf0', forestgreen: '#228b22', fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff', gold: '#ffd700', goldenrod: '#daa520', gray: '#808080', green: '#008000', greenyellow: '#adff2f',
  honeydew: '#f0fff0', hotpink: '#ff69b4',
  indianred: '#cd5c5c', indigo: '#4b0082', ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa', lavenderblush: '#fff0f5', lawngreen: '#7cfc00', lemonchiffon: '#fffacd',
  lightblue: '#add8e6', lightcoral: '#f08080', lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgreen: '#90ee90', lightgrey: '#d3d3d3', lightpink: '#ffb6c1', lightsalmon: '#ffa07a', lightseagreen: '#20b2aa', lightskyblue: '#87cefa', lightslategray: '#778899', lightsteelblue: '#b0c4de', lightyellow: '#ffffe0',
  lime: '#00ff00', limegreen: '#32cd32', linen: '#faf0e6',
  magenta: '#ff00ff', maroon: '#800000',
  mediumaquamarine: '#66cdaa', mediumblue: '#0000cd', mediumorchid: '#ba55d3', mediumpurple: '#9370d8', mediumseagreen: '#3cb371', mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc', mediumvioletred: '#c71585',
  midnightblue: '#191970', mintcream: '#f5fffa', mistyrose: '#ffe4e1', moccasin: '#ffe4b5',
  navajowhite: '#ffdead', navy: '#000080',
  oldlace: '#fdf5e6', olive: '#808000', olivedrab: '#6b8e23', orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6',
  palegoldenrod: '#eee8aa', palegreen: '#98fb98', paleturquoise: '#afeeee', palevioletred: '#d87093', papayawhip: '#ffefd5', peachpuff: '#ffdab9', peru: '#cd853f', pink: '#ffc0cb', plum: '#dda0dd', powderblue: '#b0e0e6', purple: '#800080',
  rebeccapurple: '#663399', red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1',
  saddlebrown: '#8b4513', salmon: '#fa8072', sandybrown: '#f4a460', seagreen: '#2e8b57', seashell: '#fff5ee', sienna: '#a0522d', silver: '#c0c0c0', skyblue: '#87ceeb', slateblue: '#6a5acd', slategray: '#708090', snow: '#fffafa', springgreen: '#00ff7f', steelblue: '#4682b4',
  tan: '#d2b48c', teal: '#008080', thistle: '#d8bfd8', tomato: '#ff6347', turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3', white: '#ffffff', whitesmoke: '#f5f5f5',
  yellow: '#ffff00', yellowgreen: '#9acd32'
};
// tslint:enable
// cSpell:enable