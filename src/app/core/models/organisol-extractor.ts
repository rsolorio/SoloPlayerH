import { IColorExtractionData, IColorExtractor } from './color-extractor-factory.class';
import { ColorG, IColorBucket } from './color-g.class';

export class OrganisolExtractor implements IColorExtractor {
  public extract(data: IColorExtractionData): ColorG[] {
    // GET DOMINANT COLORS
    const allImageColors: ColorG[] = [];
    this.loadColorsFromImageData(data.fullData, allImageColors);
    // Dominant colors in order
    const dominantColors = this.getDominantColors(allImageColors, data.dominantColorDistanceThreshold);

    // This is a logic that I don't fully understand but this is how it is implemented in the original code
    // When getting colors from the full image, the first bucket of similar colors is ignored
    // NOTE: the first bucket actually represents colors similar to the top border color
    // Although we remove one from the color count, we later add the background color as one more color
    dominantColors.shift();

    // GET BORDER COLORS
    let borderImageColors: ColorG[] = [];
    let isTransparentBorder = false;

    // 1px top border and 1px margin right
    isTransparentBorder = this.loadColorsFromImageData(data.topBorderData, borderImageColors) || isTransparentBorder;
    // 1px right border and 1px margin bottom
    isTransparentBorder = this.loadColorsFromImageData(data.rightBorderData, borderImageColors) || isTransparentBorder;
    // 1px left border and 1px margin top
    isTransparentBorder = this.loadColorsFromImageData(data.leftBorderData, borderImageColors) || isTransparentBorder;
    // 1px bottom border and 1px margin left
    isTransparentBorder = this.loadColorsFromImageData(data.bottomBorderData, borderImageColors) || isTransparentBorder;

    if (isTransparentBorder) {
      borderImageColors = [];
    }

    // DETERMINE BG COLOR
    let backgroundColor = dominantColors[0];
    if (borderImageColors.length > 0) {
      const borderColors = this.getDominantColors(borderImageColors, data.dominantColorDistanceThreshold, 1);
      backgroundColor = borderColors[0];
    }

    let filteredDominantColors = dominantColors;
    if (data.colorCount > 0 && dominantColors.length > data.colorCount) {
      filteredDominantColors = dominantColors.filter(color => {
        const brightnessDifference = backgroundColor.brightness - color.brightness;
        return Math.abs(brightnessDifference) > data.defaultBrightnessThreshold;
      });
    }

    // Sort colors by dominance
    const finalColors = filteredDominantColors.sort((a, b) => {
      if (a.dominance > b.dominance) {
        return -1;
      }
      if (a.dominance < b.dominance) {
        return 1;
      }
      return 0;
    });

    // Add the background color as the first item of the list
    finalColors.unshift(backgroundColor);
    this.addDefaultColors(finalColors);
    if (data.colorCount > 0) {
      return finalColors.slice(0, data.colorCount);
    }
    return finalColors;
  }

  /**
   * Loads the image data colors into the destination array and returns whether the data is transparent or not.
   * @param source the image data that will be used as source of the colors.
   * @param destination an array that will be used to add the colors to.
   */
  private loadColorsFromImageData(source: ImageData, destination: ColorG[]): boolean {
    // TODO: expose an argument to specify how accurate this process will be;
    // instead of iterating all colors in the picture, iterate every other color, etc
    // analyze just a percentage of the image data.
    // If not specified, determine an given value in case the image is too big.
    const data = source.data;
    let isTransparent = false;

    // Iterate every four items based on R-G-B-A
    for (let index = 0; index < data.length; index += 4) {
      // the last item will determine if it is transparent
      if (data[index + 3] === 0) {
        isTransparent = true;
        continue;
      }
      // the first three items will determine the actual color
      destination.push(ColorG.fromRgba(data[index], data[index + 1], data[index + 2]));
    }
    return isTransparent;
  }

  /**
  * Get a list of dominant colors by gathering buckets of similar colors,
  * getting an average for each bucket, and returning specified number of colors.
  * @param colorList List of colors to evaluate.
  * @param threshold The color distance threshold that determine how similar two colors are.
  * @param count Number of colors to return. Anything below one will return all colors.
  * @returns A list of colors.
  */
   private getDominantColors(colorList: ColorG[], threshold: number, count?: number): ColorG[] {
    // Get a list of color buckets. Each bucket contains a list of similar colors.
    const colorBuckets = this.gatherSimilarColors(colorList, threshold);

    // Sort buckets from higher number of colors desc
    const sortedColorBuckets = colorBuckets.sort((listA, listB) => {
      return listB.colors.length - listA.colors.length;
    });

    // If no count specified use the total number of buckets.
    if (!count) {
      count = sortedColorBuckets.length;
    }

    // Just get the number of buckets specified by the count
    const finalColorBuckets = sortedColorBuckets.slice(0, count);
    // Convert each bucket to an average color
    const result = finalColorBuckets.map(colorBucket => {
      return ColorG.average(colorBucket.colors);
    });
    return result;
  }

  private gatherSimilarColors(colorList: ColorG[], threshold: number): IColorBucket[] {
    const colorBuckets = ColorG.group(colorList, (colorA, colorB) => this.areSimilar(colorA, colorB, threshold));
    return colorBuckets;
  }

  /**
  * Determines if two colors are similar based on their color distance.
  * @param color1 First color to compare.
  * @param color2 Second color to compare.
  * @param threshold The value that determines how close the distance between two colors should be in order to be considered similar.
  * The lower the value the more similar they need to be in order to be considered the same.
  * The higher the value the less similar they need to be in order to be considered the same.
  * @returns True if the colors are similar, False otherwise.
  */
  private areSimilar(color1: ColorG, color2: ColorG, threshold: number): boolean {
    return color1.distanceYuv(color2) < threshold;
  }

  private addDefaultColors(colors: ColorG[]) {
    if (colors.length > 2) {
      return;
    }
    const blackColor = ColorG.black;
    const whiteColor = ColorG.white;
    const grayColor = ColorG.gray;

    // No colors, add three
    if (colors.length === 0) {
      colors.push(blackColor);
      colors.push(whiteColor);
      colors.push(grayColor);
    }
    // One color, add two
    else if (colors.length === 1) {
      const color = colors[0];
      if (color.closest.hueHex === blackColor.closest.hueHex) {
        colors.push(whiteColor);
        colors.push(grayColor);
      }
      else if (color.closest.hueHex === whiteColor.closest.hueHex) {
        colors.push(blackColor);
        colors.push(grayColor);
      }
      else if (color.closest.hueHex === grayColor.closest.hueHex) {
        colors.push(blackColor);
        colors.push(whiteColor);
      }
      else {
        colors.push(color.brightness >= 0.5 ? blackColor : whiteColor);
        colors.push(grayColor);
      }
    }
    // Two colors, add one
    else {
      const color1 = colors[0];
      const color2 = colors[1];

      if (color1.closest.hueHex !== blackColor.closest.hueHex && color2.closest.hueHex !== blackColor.closest.hueHex) {
        colors.push(blackColor);
      }
      else if (color1.closest.hueHex !== whiteColor.closest.hueHex && color2.closest.hueHex !== whiteColor.closest.hueHex) {
        colors.push(whiteColor);
      }
      else {
        colors.push(grayColor);
      }
    }
  }
}