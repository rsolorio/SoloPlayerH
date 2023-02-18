import { ColorG } from './color-g.class';
import { OrganisolExtractor } from './organisol-extractor';

/**
 * Interface for holding the image data used to get the colors.
 */
export interface IColorExtractionData {
  /** The name of the extractor to use for getting the colors. */
  extractorName: ColorExtractorName;
  /** The pixel data of the top border of the image. */
  topBorderData: ImageData;
  /** The pixel data of the bottom border of the image. */
  bottomBorderData: ImageData;
  /** The pixel data of the right border of the image. */
  rightBorderData: ImageData;
  /** The pixel data of the left border of the image. */
  leftBorderData: ImageData;
  /** The pixel data of the full image. */
  fullData: ImageData;
  /** The number of colors to return from the image data. */
  colorCount: number;
  /**
   * The lower the value the more similar they need to be in order to be considered the same.
   * The higher the value the less similar they need to be in order to be considered the same.
   */
  dominantColorDistanceThreshold: number;
  reducedColorDistanceThreshold: number;
  defaultBrightnessThreshold: number;
}

/**
 * Interface that exposes a method to get a list of colors from an image.
 * Classes implementing this interface must use data types supported by
 * service workers.
 */
export interface IColorExtractor {
  /**
   * Gets a list of colors from
   * @param data The input data used to get the list of colors.
   */
  extract(data: IColorExtractionData): ColorG[];
}

/** Name that identifies the class that will be used by the service worker to extract colors. */
export enum ColorExtractorName {
  None = 'None',
  Colibri = 'Colibri',
  Organisol = 'Organisol'
}

/**
 * Factory class for creating color extractor objects.
 */
export class ColorExtractorFactory {
  /** Creates a new instance of the specified color extractor. */
  public static get(name: ColorExtractorName): IColorExtractor {
    switch (name) {
      case ColorExtractorName.Organisol:
        return new OrganisolExtractor();
      default:
        return null;
    }
  }
}