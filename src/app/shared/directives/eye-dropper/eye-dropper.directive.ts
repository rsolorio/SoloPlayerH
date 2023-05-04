import { Directive, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { ColorG, IColorG } from 'src/app/core/models/color-g.class';
import { ICoordinate } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ImageService } from 'src/app/platform/image/image.service';

/**
 * Directive that allows to pick colors from images. It is meant to be placed in a canvas element
 * and requires a reference to a table where the  it will display a zoomed version of an area around
 * the mouse cursor.
 * It uses the native API outside the angular zone so it doesn't cause extra change detection cycles.
 */
@Directive({
  selector: '[spEyeDropper]'
})
export class EyeDropperDirective {
  @Input() public eyeDropperTableId: string;
  @Input() public eyeDropperHoverId: string;
  @Output() public eyeDropperColorSelected: EventEmitter<IColorG> = new EventEmitter();
  @Output() public eyeDropperColorHover: EventEmitter<IColorG> = new EventEmitter();
  private canvas: HTMLCanvasElement;
  private imageData: ImageData;
  private hoverColor: ColorG;
  private tableElement: HTMLTableElement;
  private hoverElement: HTMLElement;
  // 0-10 (11x11) matrix
  private matrixSize = 11;
  // middle point 5,5 (6x6)
  private middlePoint = 5;
  constructor(private elementRef: ElementRef, private utility: UtilityService, private imageService: ImageService) {
    this.canvas = elementRef.nativeElement as HTMLCanvasElement;
    this.utility.ngZone.runOutsideAngular(() => {
      this.canvas.addEventListener('mousemove', mouseMove => {
        this.drop(mouseMove);
      });
      this.canvas.addEventListener('click', () => {
        this.eyeDropperColorSelected.emit(this.hoverColor.i);
      });
    });
  }

  public drop(mouseMove: MouseEvent): void {
    if (!this.tableElement) {
      this.tableElement = document.getElementById(this.eyeDropperTableId) as HTMLTableElement;
      if (!this.tableElement) {
        return;
      }
      this.prepareEyeDropTable(this.tableElement);
    }
    if (this.eyeDropperHoverId) {
      this.hoverElement = document.getElementById(this.eyeDropperHoverId);
    }
    const pictureCanvasRect = this.canvas.getBoundingClientRect();
    const coordinate = this.utility.getMouseCoordinate(pictureCanvasRect, mouseMove);
    this.hoverColor = this.buildEyeDropper(this.tableElement, this.imageData, coordinate);
    //this.eyeDropperColorHover.emit(this.hoverColor.i);
    if (this.hoverElement) {
      this.hoverElement.style.backgroundColor = this.hoverColor.rgbFormula;
    }
  }

  public draw(image: HTMLImageElement): void {
    const context = this.canvas.getContext('2d');
    context.drawImage(image, 0, 0, image.width, image.height);
    this.imageData = context.getImageData(0, 0, image.width, image.height);
  }

  private buildEyeDropper(
    tableElement: HTMLTableElement,
    source: ImageData,
    middlePointCoordinate?: ICoordinate,
    emptyColor?: ColorG
  ): ColorG {
    // Recommended styles for the table element:
    // same width and height
    // border: 1px solid gray; padding: 0;
    let result: ColorG;
    // If no coordinate specified create an outside boundary coordinate to get an empty eye dropper
    const coordinate = middlePointCoordinate ? middlePointCoordinate : { x: this.matrixSize, y: this.matrixSize };
    const xStart = coordinate.x - this.middlePoint;
    const yStart = coordinate.y - this.middlePoint;

    for (let rowIndex = 0; rowIndex < this.matrixSize; rowIndex++) {
      for (let cellIndex = 0; cellIndex < this.matrixSize; cellIndex++) {
        const cell = tableElement.rows[rowIndex].cells[cellIndex];
        // Determine pixel position based on row and cell
        const pixelX = xStart + cellIndex;
        const pixelY = yStart + rowIndex;

        // Default color
        let pixelColor = emptyColor ? emptyColor : ColorG.white;
        // If the pixel is inside the boundaries of the image, get the proper color
        if (pixelX >= 0 && pixelX < source.width && pixelY >= 0 && pixelY < source.height) {
          // Image data matrix example
          // Image dimensions:
          // width: 2, height: 2, pixels: 4
          // Data array for 4 pixels (each pixel represented by 4 values: RGBA)
          // [R, G, B, A, R, G, B, A, R, G, B, A, R, G, B, A] (16 items)
          // Get the RGBA for a given pixel position
          // index = (x + y * width) * 4;
          // Index values for each pixel position
          // x: 0, y: 0, index = 0; R:0, G:1, B:2, A:3
          // x: 1, y: 0, index = 4; R:4, G:5, B:6, A:7
          // x: 0, y: 1, index = 8; R:8, G:9, B:10, A:11
          // x: 1, y: 1, index = 12; R:12, G:13, B:14, A:15
          const pixelIndex = (pixelX + pixelY * source.width) * 4;
          const r = source.data[pixelIndex];
          const g = source.data[pixelIndex + 1];
          const b = source.data[pixelIndex + 2];
          pixelColor = ColorG.fromRgba(r, g, b);
        }

        cell.style.backgroundColor = pixelColor.rgbFormula;

        // Special treatment for the middle point
        if (rowIndex === this.middlePoint && cellIndex === this.middlePoint) {
          // cell.classList.add('sp-border-color-red');
          // Return the color of the middle point
          result = pixelColor;
        }
      }
    }
    return result;
  }

  private prepareEyeDropTable(tableElement: HTMLTableElement): void {
    let rebuildTable = false;
    if (tableElement.rows.length === this.matrixSize) {
      for (let rowIndex = 0; rowIndex < this.matrixSize; rowIndex++) {
        if (tableElement.rows[rowIndex].cells.length !== this.matrixSize) {
          rebuildTable = true;
        }
      }
    }
    else {
      rebuildTable = true;
    }
    if (!rebuildTable) {
      return;
    }

    tableElement.innerHTML = '';

    for (let rowIndex = 0; rowIndex < this.matrixSize; rowIndex++) {
      const row = tableElement.insertRow(rowIndex);
      for (let cellIndex = 0; cellIndex < this.matrixSize; cellIndex++) {
        const cell = row.insertCell(cellIndex);
        cell.setAttribute('data-x', cellIndex.toString());
        cell.setAttribute('data-y', rowIndex.toString());
        cell.classList.add('sp-cell-eye-dropper');
      }
    }
  }
}
