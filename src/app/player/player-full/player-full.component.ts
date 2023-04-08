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
      // Assume that only file images might need resize (for now)
      if (this.image.srcType === ImageSrcType.FileUrl) {
        // This means that the image hasn't been resized yet
        this.imageService.shrinkImage(this.image, 700).then(newSrc => {
          if (newSrc) {
            // Set src type first, since once we set the src this method will be fired again
            this.image.srcType = ImageSrcType.DataUrl;
            this.image.src = newSrc;
          }
          else {
            // If no src it means that it doesn't need resizing
            this.resizeImageIfNeeded();
            this.loadPalette();
          }
        });
      }
      else {
        this.resizeImageIfNeeded();
        this.loadPalette();
      }
    }
    else {
      this.resizeImageIfNeeded();
      this.loadPalette();
    }
  }

  public onImageContainerResized(containerSize: ISize): void {
    this.imageControlsEnabled = false;
    if (this.pictureRef && this.pictureRef.nativeElement) {
      const imageNaturalSize: ISize = {
        height: this.pictureRef.nativeElement.naturalHeight,
        width: this.pictureRef.nativeElement.naturalWidth
      };
      this.imageSize = this.imageService.getResizeDimensions(imageNaturalSize, containerSize);
    }
  }

  private resizeImageIfNeeded(): void {
    if (!this.imageSize.height || !this.imageSize.width) {
      this.onImageContainerResized(this.resizeObserver.lastSize);
    }
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
