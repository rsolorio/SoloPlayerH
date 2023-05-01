import { Directive, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { ColorG, IColorG } from 'src/app/core/models/color-g.class';
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
    }
    if (this.eyeDropperHoverId) {
      this.hoverElement = document.getElementById(this.eyeDropperHoverId);
    }
    const pictureCanvasRect = this.canvas.getBoundingClientRect();
    const coordinate = this.utility.getMouseCoordinate(pictureCanvasRect, mouseMove);
    this.hoverColor = this.imageService.buildEyeDropper(this.tableElement, this.imageData, coordinate);
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
}
