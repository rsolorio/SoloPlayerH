import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { IColorExtractionData } from 'src/app/core/models/color-extractor-factory.class';
import { ColorG, IColorG } from 'src/app/core/models/color-g.class';
import { IEventArgs, IPosition, ISize } from 'src/app/core/models/core.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { WorkerName, WorkerService } from 'src/app/core/services/worker/worker.service';
import { ImagePreviewService } from 'src/app/related-image/image-preview/image-preview.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerStatus, PlayMode, RepeatMode } from 'src/app/shared/models/player.enum';
import { ColorUtilityService } from 'src/app/shared/services/color-utility/color-utility.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { DialogService } from 'src/app/platform/dialog/dialog.service';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { ValueListSelectorService } from 'src/app/value-list/value-list-selector/value-list-selector.service';
import { PlayerComponentBase } from '../player-component-base.class';
import { PlayerOverlayStateService } from '../player-overlay/player-overlay-state.service';
import { MusicImageSourceType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { ImageSrcType } from 'src/app/core/globals.enum';
import { ColorServiceName, ColorSort, IFullColorPalette } from 'src/app/shared/services/color-utility/color-utility.interface';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { ImageService } from 'src/app/platform/image/image.service';
import { ResizeObserverDirective } from 'src/app/shared/directives/resize-observer/resize-observer.directive';

@Component({
  selector: 'sp-player-full',
  templateUrl: './player-full.component.html',
  styleUrls: ['./player-full.component.scss']
})
export class PlayerFullComponent extends PlayerComponentBase {
  @ViewChild('picture') private pictureRef: ElementRef;
  @ViewChild('pictureCanvas') private pictureCanvasRef: ElementRef;
  @ViewChild('tableEyeDropper') private tableEyeDropperRef: ElementRef;
  @ViewChild(ResizeObserverDirective) private resizeObserver: ResizeObserverDirective;
  public PlayerStatus = PlayerStatus;
  public RepeatMode = RepeatMode;
  public PlayMode = PlayMode;
  public palette: IFullColorPalette;
  public imageSize: ISize = { height: 0, width: 0 };
  public isLoadingPalette = false;
  public imageControlsEnabled = false;
  public lyricsOverlayEnabled = false;
  public fileInfoVisible = true;
  public colorHover = ColorG.black;
  public colorSelected = ColorG.black;
  public imageCursorPosition: IPosition;
  private imageData: ImageData;
  private sourceImageMaxSize = 700;
  constructor(
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private menuService: MenuService,
    private db: DatabaseService,
    private colorUtility: ColorUtilityService,
    private imageService: ImageService,
    private worker: WorkerService,
    private events: EventsService,
    private dialog: DialogService,
    private utility: UtilityService,
    private imagePreview: ImagePreviewService,
    private valueListService: ValueListSelectorService)
  {
    super(playerService, playerOverlayService, events, menuService, db, dialog, utility, imagePreview, valueListService, imageService);
  }

  public onInit(): void {
    super.onInit();
    this.setupPalette(this.colorUtility.getDefaultColors());
  }

  public onImageLoad(): void {
    if (this.image.sourceType === MusicImageSourceType.ImageFile) {
      // Assume that only file images might need shrinking (for now)
      if (this.image.srcType === ImageSrcType.FileUrl) {
        // A file url is the original source of the image which means it might need shrinking
        this.imageService.shrinkImage(this.image, this.sourceImageMaxSize).then(newSrc => {
          if (newSrc) {
            // Set src type first, since once we set the src this method will be fired again
            this.image.srcType = ImageSrcType.DataUrl;
            this.image.src = newSrc;
          }
          // If the result of the method is empty, the image didn't need shrinking
          else {
            // A new image requires to recalculate the size
            this.resizeImageElement();
            this.loadPalette();
          }
        });
      }
      else {
        // A new image requires to recalculate the size
        this.resizeImageElement();
        this.loadPalette();
      }
    }
    else {
      // A new image requires to recalculate the size
      this.resizeImageElement();
      this.loadPalette();
    }
  }

  /**
   * Resize observer event handler that tells when the parent of the image element has been resized.
   * This process relies on the natural size of the image, so if the source image changes
   * this calculation has to run again.
   */
  public onImageContainerResized(containerSize: ISize): void {
    this.imageControlsEnabled = false;
    if (this.pictureRef && this.pictureRef.nativeElement) {
      const imageNaturalSize: ISize = {
        height: this.pictureRef.nativeElement.naturalHeight,
        width: this.pictureRef.nativeElement.naturalWidth
      };
      // Generate the new dimensions for the element
      this.imageSize = this.imageService.getResizeDimensions(imageNaturalSize, containerSize);
    }
  }

  /**
   * Forces the image element to resize according to its parent.
   * It uses the last known size of the parent.
   * Do not confuse these two routines:
   * 1. Resizing the image element based on its parent
   * - This is done to react to changes in the window;
   * - it emulates the "object-fit:contain;" css property.
   * 2. Shrinking the actual image source
   * - This is done to reduce the size of the image before processing colors;
   * - it generates an image with less bits to process which makes loading the palette faster;
   * - it also makes the eye dropper faster.
   */
  private resizeImageElement(): void {
    this.onImageContainerResized(this.resizeObserver.lastSize);
  }

  public toggleLyrics(): void {
    if (this.lyricsOverlayEnabled) {
      this.lyricsOverlayEnabled = false;
    }
    else {
      // Only enable it if the song has lyrics
      if (this.song.lyrics) {
        // Remove toolbar if needed
        this.imageControlsEnabled = false;
        // Toggle
        this.lyricsOverlayEnabled = true;
      }
    }
  }

  public toggleLive(): void {
    const song = this.model.playerList.current.song;
    const newValue = !song.live;
    this.db.setLive(song.id, newValue).then(() => {
      song.live = newValue;
    });
  }

  /**
   * Loads the color palette of the current image and fires the "paletteLoaded" event.
   */
  private async loadPalette(): Promise<void> {
    this.isLoadingPalette = true;
    let colors: ColorG[];
    if (this.colorUtility.isWorkerSupported()) {
      const colorData = this.colorUtility.getColorData(this.pictureRef.nativeElement);
      const rawColors = await this.worker.run<IColorExtractionData, IColorG[]>(WorkerName.ColorPalette, colorData);
      colors = ColorG.fromColorObjects(rawColors);
    }
    else {
      colors = this.colorUtility.getColors(this.pictureRef.nativeElement);
    }

    this.setupPalette(colors);
    if (this.imageControlsEnabled) {
      this.drawCanvasAndLoadData();
      this.colorHover = this.imageService.buildEyeDropper(this.tableEyeDropperRef.nativeElement, this.imageData);
    }
    this.isLoadingPalette = false;
  }

  private setupPalette(colors: ColorG[]): void {
    // TODO: we no longer need a full palette, only the three main colors
    this.palette = this.colorUtility.buildPalette(colors[0], colors, ColorServiceName.Default, ColorSort.Contrast);
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
  }

  public onImageControlsClose(e: Event): void {
    if (!this.imageControlsEnabled) {
      return;
    }
    this.imageControlsEnabled = false;
    e.stopPropagation();
  }

  public onToolbarBack(e: Event): void {
    if (!this.imageControlsEnabled || this.isLoadingPalette) {
      return;
    }
    if (this.images.length === 0 || this.images.length === 1) {
      // Don't do anything here
      return;
    }
    if (this.selectedImageIndex === 0) {
      // We are moving backwards, since this is the first item
      // move to the last one
      this.selectedImageIndex = this.images.length - 1;
    }
    else {
      this.selectedImageIndex--;
    }
    e.stopPropagation();
  }

  public onToolbarNext(e: Event): void {
    if (!this.imageControlsEnabled || this.isLoadingPalette) {
      return;
    }
    if (this.images.length === 0 || this.images.length === 1) {
      // Don't do anything here
      return;
    }
    if (this.selectedImageIndex === this.images.length - 1) {
      // We are moving forward, since this is the last item,
      // move to the first one
      this.selectedImageIndex = 0;
    }
    else {
      this.selectedImageIndex++;
    }
    e.stopPropagation();
  }

  public onToolbarReset(): void {
    this.loadPalette();
  }

  public getEllipsisColorVar(): string {
    return `--ellipsis-color: ${this.palette.primary.toRgbaFormula()};`
  }

  public onImageClick(pointerEvent: MouseEvent): void {
    if (this.images.length) {
      this.drawCanvasAndLoadData();
      // This will make the eye dropper load empty
      this.imageControlsEnabled = true;
      // This will load the eye dropper when clicking the image
      setTimeout(() => {
        this.onCanvasMouseMove(pointerEvent);
      });
    }
  }

  private drawCanvasAndLoadData(): void {
    const canvas = this.pictureCanvasRef.nativeElement as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    context.drawImage(this.pictureRef.nativeElement, 0, 0, this.pictureRef.nativeElement.width, this.pictureRef.nativeElement.height);
    this.imageData = context.getImageData(0, 0, this.imageSize.width, this.imageSize.height);
  }

  public onCanvasClick() {
    this.colorSelected = ColorG.fromColorObject(this.colorHover);
  }

  public onCanvasMouseMove(mouseMove: MouseEvent): void {
    const pictureCanvasRect = this.pictureCanvasRef.nativeElement.getBoundingClientRect();
    const coordinate = this.utility.getMouseCoordinate(pictureCanvasRect, mouseMove);
    this.colorHover = this.imageService.buildEyeDropper(this.tableEyeDropperRef.nativeElement, this.imageData, coordinate);
  }

  public onBackgroundColorClick(): void {
    this.palette.background = ColorG.fromColorObject(this.colorSelected);
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
  }
  public onPrimaryColorClick(): void {
    this.palette.primary = ColorG.fromColorObject(this.colorSelected);
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
  }
  public onSecondaryColorClick(): void {
    this.palette.secondary = ColorG.fromColorObject(this.colorSelected);
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
  }
  public onSelectedColorClick(): void {
    this.colorSelected = this.colorSelected.blackOrWhite;
  }

  protected beforeCollapse(): void {
    this.imageControlsEnabled = false;
  }

  protected onTrackChanged(eventArgs: IEventArgs<IPlaylistSongModel>): void {
    this.imageControlsEnabled = false;
    this.lyricsOverlayEnabled = false;
    super.onTrackChanged(eventArgs);
  }
}
