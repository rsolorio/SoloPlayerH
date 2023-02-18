import { ColorExtractorFactory, ColorExtractorName, IColorExtractionData, IColorExtractor } from 'src/app/core/models/color-extractor-factory.class';
import { ColorG } from 'src/app/core/models/color-g.class';
import { ColorServiceName, IColorService } from './color-utility.interface';

export abstract class ColorServiceBase implements IColorService {
  private useElementSize = false;
  private _extractor: IColorExtractor;
  public getColors(imageElement: any, colorCount: number): ColorG[] {
    if (this.extractorName === ColorExtractorName.None) {
      return [];
    }
    const data = this.getColorData(imageElement, colorCount);
    const extractor = this.getExtractor();
    const result = extractor.extract(data);
    return result;
  }

  public getColorData(imageElement: any, colorCount: number): IColorExtractionData {
    const canvasElement = document.createElement('canvas');

    if (this.useElementSize) {
      // Using img element size
      canvasElement.width = imageElement.width;
      canvasElement.height = imageElement.height;
    }
    else {
      // Using actual image size
      canvasElement.width = imageElement.naturalWidth;
      canvasElement.height = imageElement.naturalHeight;
    }

    // HACK: making this object as "any" since, for some reason, after adding the willReadFrequently attribute, building the project will cause the error:
    // Property 'getImageData' does not exist on type 'RenderingContext'
    // The error also goes away when building for a second time
    const canvasContext = canvasElement.getContext('2d', { willReadFrequently: true }) as any;
    canvasContext.drawImage(imageElement, 0, 0, canvasElement.width, canvasElement.height);

    const result: IColorExtractionData = {
      extractorName: this.extractorName,
      topBorderData: canvasContext.getImageData(0, 0, canvasElement.width - 1, 1),
      rightBorderData: canvasContext.getImageData(canvasElement.width - 1, 0, 1, canvasElement.height - 1),
      leftBorderData: canvasContext.getImageData(0, 1, 1, canvasElement.height - 1),
      bottomBorderData: canvasContext.getImageData(1, canvasElement.height - 1, canvasElement.width - 1, 1),
      fullData: canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height),
      colorCount: colorCount,
      dominantColorDistanceThreshold: 0.1,
      reducedColorDistanceThreshold: 0.3,
      defaultBrightnessThreshold: 0.2
    };
    return result;
  }

  public abstract get name(): ColorServiceName;
  protected abstract get extractorName(): ColorExtractorName;

  public getExtractor(): IColorExtractor {
    if (!this._extractor) {
      this._extractor = ColorExtractorFactory.get(this.extractorName);
    }
    return this._extractor;
  }
}