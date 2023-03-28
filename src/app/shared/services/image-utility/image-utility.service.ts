import { Injectable } from '@angular/core';
import { IArea, ICoordinate, ISize } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { RelatedImageEntity } from '../../entities';
import { FileService } from '../file/file.service';
import { MusicImageSourceType } from '../music-metadata/music-metadata.enum';
import { MusicMetadataService } from '../music-metadata/music-metadata.service';

@Injectable({
  providedIn: 'root'
})
export class ImageUtilityService {

  constructor(
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private utility: UtilityService)
  { }

  /**
   * Gets the actual image coordinates inside an img tag.
   * This routine assumes the img is set to object-fit: contain and that the image is
   * vertically and horizontally centered.
   * @param imageElement The img element.
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

  public getResizeDimensions(childSize: ISize, parentSize: ISize): ISize {
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

    return result;
  }

  public async setSrc(relatedImages: RelatedImageEntity[]): Promise<void> {
    for (const relatedImage of relatedImages) {
      if (relatedImage.sourceType === MusicImageSourceType.AudioTag) {
        await this.setSrcFromAudioTag(relatedImage);
      }
      else if (relatedImage.sourceType === MusicImageSourceType.ImageFile) {
        await this.setSrcFromImageFile(relatedImage);
      }
      else if (relatedImage.sourceType === MusicImageSourceType.Url) {
        relatedImage.src = relatedImage.sourcePath;
      }
    }
  }

  private async setSrcFromAudioTag(relatedImage: RelatedImageEntity): Promise<void> {
    const buffer = await this.fileService.getBuffer(relatedImage.sourcePath);
    const audioInfo = await this.metadataService.getMetadata(buffer);
    if (audioInfo.metadata.common.picture && audioInfo.metadata.common.picture.length) {
      const picture = audioInfo.metadata.common.picture[relatedImage.sourceIndex];
      if (picture) {
        relatedImage.src = this.metadataService.getImage([picture]).src;
      }
    }
  }

  private async setSrcFromImageFile(relatedImage: RelatedImageEntity): Promise<void> {
    // TODO: resize image
    relatedImage.src = this.utility.fileToUrl(relatedImage.sourcePath);
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
}
