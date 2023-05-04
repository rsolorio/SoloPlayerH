import { IArea, ICoordinate, IImage, IImageSource, ISize } from 'src/app/core/models/core.interface';
import { FileService } from '../file/file.service';
import { AudioMetadataService } from '../audio-metadata/audio-metadata.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { MusicImageSourceType } from '../audio-metadata/audio-metadata.enum';

export abstract class ImageService {

  constructor(private fileSvc: FileService, private metadataSvc: AudioMetadataService, private utilitySvc: UtilityService) { }

  abstract getScreenshot(delayMs?: number): Promise<string>;

  public getImageFromSource(source: IImageSource): Promise<IImage> {
    if (source.sourceType === MusicImageSourceType.AudioTag) {
      return this.getImageFromTag(source);
    }
    if (source.sourceType === MusicImageSourceType.ImageFile) {
      return this.getImageFromFile(source);
    }
    if (source.sourceType === MusicImageSourceType.Url) {
      return this.getImageFromUrl(source);
    }
    return null;
  }

  /**
   * Gets the actual image coordinates inside an img tag.
   * This routine assumes the img is set to object-fit: contain and that the image is
   * vertically and horizontally centered.
   * @param imageElement 
   * @returns 
   */
  public getImageArea(imageElement: any): IArea {
    const whElementRatio = imageElement.width / imageElement.height;
    const whImageRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const widthDifference = imageElement.naturalWidth - imageElement.width;
    const heightDifference = imageElement.naturalHeight - imageElement.height;

    const result: IArea = {
      start: {x: 0, y: 0},
      end: {x: 0, y: 0},
      width: 0,
      height: 0
    };

    if (widthDifference > 0 || heightDifference > 0) {
      // the element is making the image smaller
      if (whImageRatio > whElementRatio) {
        this.calculateImageAreaByWidth(imageElement, result);
      }
      else if (whImageRatio < whElementRatio) {
        this.calculateImageAreaByHeight(imageElement, result);
      }
      else {
        // element and image have the same ratio, so they will have the same size
        // it doesn't matter which method we use here
        this.calculateImageAreaByHeight(imageElement, result);
      }
    }
    else if (widthDifference < 0 && heightDifference < 0) {
      // the element is making the image bigger
      if (whImageRatio > whElementRatio) {
        this.calculateImageAreaByWidth(imageElement, result);
      }
      else if (whImageRatio < whElementRatio) {
        this.calculateImageAreaByHeight(imageElement, result);
      }
      else {
        // element and image have the same ratio, so they will have the same size
        // it doesn't matter which method we use here
        this.calculateImageAreaByHeight(imageElement, result);
      }
    }
    else {
      // the element and the image have the same size
      result.width = imageElement.width;
      result.height = imageElement.height;
      result.start.x = 0;
      result.end.x = imageElement.width - 1;
      result.start.y = 0;
      result.end.y = imageElement.height - 1;
    }

    return result;
  }

  /**
   * Determines if the specified coordinate is inside the image area.
   * @param coordinate The coordinate to validate.
   * @param imageElement The reference to the image element.
   * @returns True of the coordinate is inside the image area, otherwise False.
   */
  public isInImageArea(coordinate: ICoordinate, imageElement: any): boolean {
    const area = this.getImageArea(imageElement);
    if (coordinate.x >= area.start.x && coordinate.x <= area.end.x &&
        coordinate.y >= area.start.y && coordinate.y <= area.end.y) {
      return true;
    }
    return false;
  }

  public getResizeDimensions(childSize: ISize, parentSize: ISize, round?: boolean): ISize {
    // Set minimum size for this to work
    if (childSize.height === 0) {
      childSize.height = 1;
    }
    if (childSize.width === 0) {
      childSize.width = 1;
    }

    const whParentRatio = parentSize.width / parentSize.height;
    const whChildRatio = childSize.width / childSize.height;
    const widthDifference = childSize.width - parentSize.width;
    const heightDifference = childSize.height - parentSize.height;

    const result: ISize = {
      width: 0,
      height: 0
    };

    // The image is bigger so it needs to be smaller
    if (widthDifference > 0 || heightDifference > 0) {
      if (whChildRatio > whParentRatio) {
        // Same width
        result.width = parentSize.width;
        if (whChildRatio === 1) {
          result.height = parentSize.width;
        }
        else {
          // How much the width changed
          const ratioChange = result.width / childSize.width;
          // Apply same change to height
          result.height = childSize.height * ratioChange;
        }
      }
      else if (whChildRatio < whParentRatio) {
        // Same height
        result.height = parentSize.height;
        if (whChildRatio === 1) {
          result.width = parentSize.height;
        }
        else {
          // How much the height changed
          const ratioChange = result.height / childSize.height;
          // Apply same change to width
          result.width = childSize.width * ratioChange;
        }
      }
      else {
        result.width = parentSize.width;
        result.height = parentSize.height;
      }
    }
    // The image is smaller so it needs to be bigger
    else if (widthDifference < 0 && heightDifference < 0) {
      if (whChildRatio > whParentRatio) {
        // Same width
        result.width = parentSize.width;
        // How much the width changed
        const ratioChange = result.width / childSize.width;
        // Apply same change to height
        result.height = childSize.height * ratioChange;
      }
      else if (whChildRatio < whParentRatio) {
        // Same height
        result.height = parentSize.height;
        // How much the height changed
        const ratioChange = result.height / childSize.height;
        // Apply same change to width
        result.width = childSize.width * ratioChange;
      }
      else {
        result.width = parentSize.width;
        result.height = parentSize.height;
      }
    }
    // Parent and child have same size
    else {
      result.width = parentSize.width;
      result.height = parentSize.height;
    }
  
    if (round) {
      result.height = Math.round(result.height);
      result.width = Math.round(result.width);
    }
    return result;
  }

  /**
   * Generates a new image source with smaller dimensions.
   * @param image The image to shrink
   * @param newSize The target size.
   */
  public shrinkImage(image: IImage, newSize: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const imageElement = new Image();
        imageElement.onload = () => {
          const size = this.shrink({ width: imageElement.naturalWidth, height: imageElement.naturalHeight }, newSize);
          if (!size) {
            resolve(null);
          }
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = size.width;
          canvas.height = size.height;
          context.drawImage(imageElement, 0, 0, size.width, size.height);
          resolve(canvas.toDataURL());
        };
        imageElement.src = image.src;
      }
      catch (err) {
        reject(err);
      }
    });
  }

  public shrink(size: ISize, newSize: number): ISize {
    if (size.width > size.height) {
      if (size.width > newSize) {
        return {
          width: newSize,
          height: size.height * (newSize / size.width)
        };
      }
    }
    else {
      if (size.height > newSize) {
        return {
          height: newSize,
          width: size.width * (newSize / size.height)
        }
      }
    }
    return null;
  }

  // PRIVATE METHODS //////////////////////////////////////////////////////////////////////////////

  /**
   * Calculates the area assuming the image will take the full width of the element.
   * @param imageElement A reference to the image element.
   * @param area The object that contains the result of the calculation.
   */
  private calculateImageAreaByWidth(imageElement: any, area: IArea): void {
    // the image is taking the full width of the element
    area.width = imageElement.width;
    // calculate new height
    const ratioChange = imageElement.width / imageElement.naturalWidth;
    area.height = imageElement.naturalHeight * ratioChange;
    // calculate x
    area.start.x = 0;
    area.end.x = area.width - 1;
    // calculate y
    const emptyHeight = imageElement.height - area.height;
    const halfEmptyHeight = emptyHeight / 2;
    area.start.y = halfEmptyHeight;
    area.end.y = imageElement.height - halfEmptyHeight;
  }

  /**
   * Calculates the area assuming the image will take the full height of the element.
   * @param imageElement A reference to the image element.
   * @param area The object that contains the result of the calculation.
   */
  private calculateImageAreaByHeight(imageElement: any, area: IArea): void {
    // the image is taking the full height of the element
    area.height = imageElement.height;
    // calculate new width
    const ratioChange = imageElement.height / imageElement.naturalHeight;
    area.width = imageElement.naturalWidth * ratioChange;
    // calculate x
    const emptyWidth = imageElement.width - area.width;
    const halfEmptyWidth = emptyWidth / 2;
    area.start.x = halfEmptyWidth;
    area.end.x = imageElement.width - halfEmptyWidth;
    // calculate y
    area.start.y = 0;
    area.end.y = area.height - 1;
  }

  private async getImageFromTag(source: IImageSource): Promise<IImage> {
    const buffer = await this.fileSvc.getBuffer(source.sourcePath);
    const audioInfo = await this.metadataSvc.getMetadata(buffer);
    if (audioInfo.metadata.common.picture && audioInfo.metadata.common.picture.length) {
      const picture = audioInfo.metadata.common.picture[source.sourceIndex];
      if (picture) {
        return this.metadataSvc.getImage([picture]);
      }
    }
    return null;
  }

  private async getImageFromFile(source: IImageSource): Promise<IImage> {
    return {
      src: this.utilitySvc.fileToUrl(source.sourcePath),
      srcType: ImageSrcType.FileUrl
    }
  }

  private async getImageFromUrl(source: IImageSource): Promise<IImage> {
    return {
      src: source.sourcePath,
      srcType: ImageSrcType.WebUrl
    }
  }
}
