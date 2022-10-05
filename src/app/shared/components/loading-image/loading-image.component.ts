import { Component, ViewChild, ElementRef, Output, EventEmitter, Input, OnDestroy, AfterViewInit, Renderer2 } from '@angular/core';
import { ICoordinate, ISize } from 'src/app/core/models/core.interface';
import { RelatedImageEntity } from '../../entities/related-image.entity';
import { ImageUtilityService } from '../../services/image-utility/image-utility.service';
import { IImageLoadedEventArgs, ILoadingImageModel } from './loading-image-model.interface';

@Component({
  selector: 'sp-loading-image',
  templateUrl: './loading-image.component.html',
  styleUrls: ['./loading-image.component.scss']
})
export class LoadingImageComponent implements OnDestroy, AfterViewInit {
  @ViewChild('imageElement') private imageReference: ElementRef;
  @ViewChild('shieldElement') private shieldReference: ElementRef;

  public model: ILoadingImageModel = {
    src: null,
    loadingDisabled: false,
    allowContextMenu: false,
    selectedImageIndex: -1
  };
  public isImageLoaded = false;
  public hasImageError = false;
  public isLoading = false;
  // @ts-ignore
  private parentResizeObserver: ResizeObserver;

  /** Fired when the caret icon is clicked */
  @Output() public iconClick: EventEmitter<Event> = new EventEmitter();
  /** Fired when the image has been successfully loaded. */
  @Output() public loadSuccess: EventEmitter<IImageLoadedEventArgs> = new EventEmitter();
  /** Fires when the load image process generated an error. */
  @Output() public loadError: EventEmitter<Event> = new EventEmitter();
  /** Fires when the img element is clicked. */
  @Output() public imageClick: EventEmitter<Event> = new EventEmitter();

  get src(): string {
    return this.model.src;
  }

  @Input() set src(val: string) {
    this.model.src = val;
  }

  get images(): RelatedImageEntity[] {
    return this.model.images;
  }

  @Input() set images(val: RelatedImageEntity[]) {
    if (this.model.images !== val) {
      this.model.images = val;
      if (this.model.images.length) {
        this.model.selectedImageIndex = 0;
      }
    }
  }

  get loadingDisabled(): boolean {
    return this.model.loadingDisabled;
  }

  @Input() set loadingDisabled(val: boolean) {
    this.model.loadingDisabled = val;
  }

  get allowContextMenu(): boolean {
    return this.model.allowContextMenu;
  }

  @Input() set allowContextMenu(val: boolean) {
    this.model.allowContextMenu = val;
  }

  get caretText(): string {
    return this.model.caretText;
  }

  @Input() set caretText(val: string) {
    this.model.caretText = val;
  }

  get stretch(): boolean {
    return this.model.stretch;
  }

  @Input() set stretch(val: boolean) {
    this.model.stretch = val;
  }

  get paletteEnabled(): boolean {
    return this.model.paletteEnabled;
  }

  @Input() set paletteEnabled(val: boolean) {
    this.model.paletteEnabled = val;
  }

  get autoSize(): boolean {
    return this.model.autoSize;
  }

  @Input() set autoSize(val: boolean) {
    if (this.model.autoSize !== val) {
      this.model.autoSize = val;
      this.subscribeToParentResize(this.model.autoSize);
    }
  }

  constructor(private imageUtility: ImageUtilityService, private renderer: Renderer2) { }

  public ngAfterViewInit(): void {
    this.subscribeToParentResize(this.model.autoSize);
  }

  public ngOnDestroy(): void {
    this.subscribeToParentResize(false);
  }

  public onImageLoad(e: Event): void {
    this.isImageLoaded = true;

    const imageLoadedEvent: IImageLoadedEventArgs = {
      event: e,
      oldValue: null,
      newValue: null,
      paletteEnabled: false
    };

    this.loadSuccess.emit(imageLoadedEvent);

    if (this.paletteEnabled || imageLoadedEvent.paletteEnabled) {
      // imageLoadedEvent.newValue = this.colorUtility.createPalette(this.imageReference.nativeElement);
      // this.paletteLoaded.emit(imageLoadedEvent.newValue);
      // const colors = this.colorUtility.getColors(this.imageReference.nativeElement);
      // this.colorsLoaded.emit(colors);
    }
  }

  public onImageError(e: Event): void {
    this.isImageLoaded = true;
    this.hasImageError = true;
    this.loadError.emit(e);
  }

  public onIconClick(e: Event): void {
    this.iconClick.emit(e);
  }

  public onImageClick(e: any): void {
    if (this.model.stretch || this.model.autoSize) {
      this.imageClick.emit(e);
    }
    else {
      const coordinate: ICoordinate = {
        x: e.offsetX,
        y: e.offsetY
      };
      if (this.imageUtility.isInImageArea(coordinate, this.imageReference.nativeElement)) {
        this.imageClick.emit(e);
      }
    }
  }

  public onImageContextMenu(e: Event): void {
    // prevent loading the context menu on the image
    e.preventDefault();
  }

  /**
   * Loads the color palette of the current image and fires the "paletteLoaded" event.
   */
  public loadPalette(): void {
    // if (this.colorUtility.isWorkerSupported()) {
    //   this.isLoading = true;
    //   const colorData = this.colorUtility.getColorData(this.imageReference.nativeElement);
    //   this.worker.run<IColorExtractionData, IColorG[]>(OrgWorkerName.ColorPalette, colorData).then(response => {
    //     const colors = ColorG.fromColorObjects(response);
    //     // const newPalette = this.colorUtility.buildPalette(
    //     //   colors[0], colors, this.colorUtility.getDefaultServiceName(), ColorSort.Contrast);
    //     // this.paletteLoaded.emit(newPalette);
    //     this.colorsLoaded.emit(colors);
    //     this.isLoading = false;
    //   });
    // }
    // else {
    //   // const newPalette = this.colorUtility.createPalette(this.imageReference.nativeElement);
    //   // this.paletteLoaded.emit(newPalette);
    //   const colors = this.colorUtility.getColors(this.imageReference.nativeElement);
    //   this.colorsLoaded.emit(colors);
    // }
  }

  public next(): void {
    if (!this.model.images || !this.model.images.length) {
      this.isImageLoaded = false;
      this.model.selectedImageIndex = -1;
      return;
    }

    const nextIndex = this.model.selectedImageIndex++;
    if (nextIndex >= this.model.images.length) {
      if (this.model.selectedImageIndex !== 0) {
        this.isImageLoaded = false;
        this.model.selectedImageIndex = 0;
      }
    }
    else {
      if (this.model.selectedImageIndex !== nextIndex) {
        this.isImageLoaded = false;
        this.model.selectedImageIndex = nextIndex;
      }
    }
  }

  public previous(): void {
    if (!this.model.images || !this.model.images.length) {
      this.isImageLoaded = false;
      this.model.selectedImageIndex = -1;
      return;
    }

    const previousIndex = this.model.selectedImageIndex--;
    if (previousIndex < 0) {
      if (this.model.selectedImageIndex !== this.model.images.length - 1) {
        this.isImageLoaded = false;
        this.model.selectedImageIndex = this.model.images.length - 1;
      }
    }
    else {
      if (this.model.selectedImageIndex !== previousIndex) {
        this.isImageLoaded = false;
        this.model.selectedImageIndex = previousIndex;
      }
    }
  }

  private subscribeToParentResize(on: boolean): void {
    if (on) {
      if (!this.parentResizeObserver && this.imageReference) {
        // @ts-ignore
        this.parentResizeObserver = new ResizeObserver(entries => {
          const parentEntry = entries[0];
          if (parentEntry && parentEntry.contentRect) {
            // this.utility.ngZone.run(() => {});
            const childSize: ISize = { width: 0, height: 0 };
            const parentSize: ISize = { width: parentEntry.contentRect.width, height: parentEntry.contentRect.height };
            if (this.imageReference && this.imageReference.nativeElement) {
              childSize.height = this.imageReference.nativeElement.naturalHeight;
              childSize.width = this.imageReference.nativeElement.naturalWidth;
            }
            else {
              childSize.height = 1;
              childSize.width = 1;
            }
            const size = this.imageUtility.getResizeDimensions(childSize, parentSize);
            this.setSize(this.imageReference.nativeElement, size);
            this.setSize(this.shieldReference.nativeElement, size);
          }
        });
        this.parentResizeObserver.observe(this.imageReference.nativeElement.parentElement);
      }
    }
    else {
      if (this.parentResizeObserver) {
        this.parentResizeObserver.unobserve(this.imageReference.nativeElement.parentElement);
        this.parentResizeObserver = null;
      }
    }
  }

  private setSize(element: any, size: ISize): void {
    this.renderer.setStyle(element, 'height', `${size.height}px`);
    this.renderer.setStyle(element, 'width', `${size.width}px`);
  }

}
