import { Component, ElementRef, ViewChild } from '@angular/core';
import { IColorExtractionData } from 'src/app/core/models/color-extractor-factory.class';
import { ColorG, IColorG } from 'src/app/core/models/color-g.class';
import { IEventArgs, ISize } from 'src/app/core/models/core.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { WorkerName, WorkerService } from 'src/app/core/services/worker/worker.service';
import { ImagePreviewService } from 'src/app/related-image/image-preview/image-preview.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerStatus, PlayMode, RepeatMode } from 'src/app/shared/models/player.enum';
import { ColorUtilityService } from 'src/app/shared/services/color-utility/color-utility.service';
import { DialogService } from 'src/app/platform/dialog/dialog.service';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { PlayerComponentBase } from '../player-component-base.class';
import { PlayerOverlayStateService } from '../player-overlay/player-overlay-state.service';
import { MusicImageSourceType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { IBasicColors, IFullColorPalette } from 'src/app/shared/services/color-utility/color-utility.interface';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { ImageService } from 'src/app/platform/image/image.service';
import { ResizeObserverDirective } from 'src/app/shared/directives/resize-observer/resize-observer.directive';
import { BucketPalette } from 'src/app/shared/services/color-utility/color-utility.class';
import { EyeDropperDirective } from 'src/app/shared/directives/eye-dropper/eye-dropper.directive';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { ChipSelectionService } from 'src/app/shared/components/chip-selection/chip-selection.service';
import { EntityId } from 'src/app/shared/services/database/database.seed';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';

@Component({
  selector: 'sp-player-full',
  templateUrl: './player-full.component.html',
  styleUrls: ['./player-full.component.scss']
})
export class PlayerFullComponent extends PlayerComponentBase {
  @ViewChild('picture') private pictureRef: ElementRef;
  @ViewChild(ResizeObserverDirective) private resizeObserver: ResizeObserverDirective;
  @ViewChild(EyeDropperDirective) private eyeDropper: EyeDropperDirective;
  public PlayerStatus = PlayerStatus;
  public RepeatMode = RepeatMode;
  public PlayMode = PlayMode;
  public EntityId = EntityId;
  public palette: IFullColorPalette;
  public imageSize: ISize = { height: 0, width: 0 };
  public isLoadingPalette = false;
  public imageControlsEnabled = false;
  public lyricsOverlayEnabled = false;
  public fileInfoVisible = true;
  public colorHover = ColorG.black;
  public colorSelected = ColorG.black;
  private sourceImageMaxSize = 700;
  constructor(
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private menuService: MenuService,
    private entityService: DatabaseEntitiesService,
    private colorUtility: ColorUtilityService,
    private imageService: ImageService,
    private worker: WorkerService,
    private events: EventsService,
    private dialog: DialogService,
    private utility: UtilityService,
    private imagePreview: ImagePreviewService,
    private chipSelection: ChipSelectionService,
    private options: DatabaseOptionsService)
  {
    super(playerService, playerOverlayService, events, menuService, entityService, dialog, utility, imagePreview, chipSelection, imageService, options);
  }

  public onInit(): void {
    super.onInit();
    this.palette = this.colorUtility.getDefaultPalette();
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
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
    // Since the canvas has to be recreated based on its size we need to close the image controls
    this.imageControlsEnabled = false;
    if (this.pictureRef && this.pictureRef.nativeElement) {
      const imageNaturalSize: ISize = {
        height: this.pictureRef.nativeElement.naturalHeight,
        width: this.pictureRef.nativeElement.naturalWidth
      };
      // Generate the new dimensions for the element
      this.imageSize = this.imageService.getResizeDimensions(imageNaturalSize, containerSize);
    }
    // If the image does not exist set the image size anyways because
    // other child elements could use it
    else {
      this.imageSize = containerSize;
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
    this.entityService.setLive(song.id, newValue).then(() => {
      song.live = newValue;
    });
  }

  /**
   * Loads the color palette of the current image and fires the "paletteLoaded" event.
   */
  private async loadPalette(): Promise<void> {
    if (!this.image) {
      return;
    }
    this.isLoadingPalette = true;

    if (this.image.colorSelection) {
      this.palette = this.getPaletteFromDb();
    }
    else {
      this.palette = await this.getPaletteFromImage();
      await this.savePaletteToDb();
    }
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);

    if (this.imageControlsEnabled) {
      this.eyeDropper.draw(this.pictureRef.nativeElement);
    }
    this.isLoadingPalette = false;
  }

  private getPaletteFromDb(): IFullColorPalette {
    const basicColors = JSON.parse(this.image.colorSelection) as IBasicColors;
    return this.colorUtility.basicColorsToFullPalette(basicColors);
  }

  private async getPaletteFromImage(): Promise<IFullColorPalette> {
    let colors: ColorG[];
    if (this.colorUtility.isWorkerSupported()) {
      const colorData = this.colorUtility.getColorData(this.pictureRef.nativeElement);
      const rawColors = await this.worker.run<IColorExtractionData, IColorG[]>(WorkerName.ColorPalette, colorData);
      colors = ColorG.fromColorObjects(rawColors);
    }
    else {
      colors = this.colorUtility.getColors(this.pictureRef.nativeElement);
    }

    const bucketPalette = new BucketPalette(colors);
    return bucketPalette.toFullPalette();
  }

  private async savePaletteToDb(): Promise<void> {
    if (this.image && this.palette) {
      const basicColors = this.colorUtility.fullPaletteToBasicColors(this.palette);
      this.image.colorSelection = JSON.stringify(basicColors);
      await this.image.save();
    }
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
    // Clear the color selection to reset the toolbar
    this.image.colorSelection = null;
    this.loadPalette();
  }

  public getEllipsisColorVar(): string {
    return `--ellipsis-color: ${this.palette.primary.toRgbaFormula()};`
  }

  public onImageClick(pointerEvent: MouseEvent): void {
    if (this.images.length) {
      this.eyeDropper.draw(this.pictureRef.nativeElement);
      // This will make the eye dropper load empty
      this.imageControlsEnabled = true;
      this.eyeDropper.reset();
      // This will load the eye dropper just after clicking the image
      setTimeout(() => {
        this.eyeDropper.drop(pointerEvent);
      });
    }
  }

  public onColorSelected(color: IColorG): void {
    this.colorSelected = ColorG.fromColorObject(color);
  }

  public onBackgroundColorClick(): void {
    this.palette.background = ColorG.fromColorObject(this.colorSelected);
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
    this.savePaletteToDb();
  }
  public onPrimaryColorClick(): void {
    this.palette.primary = ColorG.fromColorObject(this.colorSelected);
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
    this.savePaletteToDb();
  }
  public onSecondaryColorClick(): void {
    this.palette.secondary = ColorG.fromColorObject(this.colorSelected);
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
    this.savePaletteToDb();
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

  public togglePlaylist(): void {
    if (this.model.playerList.isVisible) {
      this.model.playerList.isVisible = false;
    }
    else {
      this.lyricsOverlayEnabled = false;
      this.imageControlsEnabled = false;
      this.model.playerList.isVisible = true;
    }
  }

  public onTrackClick(track: IPlaylistSongModel): void {
    this.playerService.playByTrack(track);
  }
}
