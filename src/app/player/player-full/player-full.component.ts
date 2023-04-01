import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { IColorExtractionData } from 'src/app/core/models/color-extractor-factory.class';
import { ColorG, IColorG } from 'src/app/core/models/color-g.class';
import { ISize } from 'src/app/core/models/core.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { WorkerName, WorkerService } from 'src/app/core/services/worker/worker.service';
import { ImagePreviewService } from 'src/app/shared/components/image-preview/image-preview.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerStatus, PlayMode, RepeatMode } from 'src/app/shared/models/player.enum';
import { BucketPalette } from 'src/app/shared/services/color-utility/color-utility.class';
import { ColorUtilityService } from 'src/app/shared/services/color-utility/color-utility.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { DialogService } from 'src/app/shared/services/dialog/dialog.service';
import { FileService } from 'src/app/shared/services/file/file.service';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { ImageUtilityService } from 'src/app/shared/services/image-utility/image-utility.service';
import { ValueListSelectorService } from 'src/app/value-list/value-list-selector/value-list-selector.service';
import { PlayerComponentBase } from '../player-component-base.class';
import { PlayerOverlayStateService } from '../player-overlay/player-overlay-state.service';
import { MusicImageSourceType } from 'src/app/shared/services/music-metadata/music-metadata.enum';
import { ImageSrcType } from 'src/app/core/globals.enum';

@Component({
  selector: 'sp-player-full',
  templateUrl: './player-full.component.html',
  styleUrls: ['./player-full.component.scss']
})
export class PlayerFullComponent extends PlayerComponentBase {
  @ViewChild('imageElement') private imageReference: ElementRef;
  public PlayerStatus = PlayerStatus;
  public RepeatMode = RepeatMode;
  public PlayMode = PlayMode;
  public palette: BucketPalette;
  public imageSize: ISize = { height: 0, width: 0 };
  private imageColors: ColorG[];
  public isLoadingPalette = false;
  public imageToolbarEnabled = false;
  public lyricsOverlayEnabled = false;
  public fileInfoVisible = true;
  constructor(
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private menuService: MenuService,
    private db: DatabaseService,
    private colorUtility: ColorUtilityService,
    private imageUtility: ImageUtilityService,
    private worker: WorkerService,
    private events: EventsService,
    private cd: ChangeDetectorRef,
    private dialog: DialogService,
    private utility: UtilityService,
    private imagePreview: ImagePreviewService,
    private valueListService: ValueListSelectorService,
    private fileService: FileService)
  {
    super(playerService, playerOverlayService, events, menuService, db, dialog, utility, imagePreview, valueListService, imageUtility);
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
        this.fileService.shrinkImage(this.image, 700).then(newSrc => {
          if (newSrc) {
            // Set src type first, since once we set the src this method will be fired again
            this.image.srcType = ImageSrcType.DataUrl;
            this.image.src = newSrc;
          }
          else {
            // If no src it means that it doesn't need resizing
            this.loadPalette();
          }
        });
      }
      else {
        this.loadPalette();
      }
    }
    else {
      this.loadPalette();
    }
  }

  public onImageContainerResized(size: ISize): void {
    if (this.imageReference && this.imageReference.nativeElement) {
      const imageNaturalSize: ISize = {
        height: this.imageReference.nativeElement.naturalHeight,
        width: this.imageReference.nativeElement.naturalWidth
      };
      this.imageSize = this.imageUtility.getResizeDimensions(imageNaturalSize, size);
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
        this.imageToolbarEnabled = false;
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
  private loadPalette(): void {
    this.isLoadingPalette = true;
    if (this.colorUtility.isWorkerSupported()) {
      const colorData = this.colorUtility.getColorData(this.imageReference.nativeElement);
      this.worker.run<IColorExtractionData, IColorG[]>(WorkerName.ColorPalette, colorData).then(response => {
        const colors = ColorG.fromColorObjects(response);
        this.setupPalette(colors);
        this.isLoadingPalette = false;
      });
    }
    else {
      const colors = this.colorUtility.getColors(this.imageReference.nativeElement);
      this.setupPalette(colors);
      this.isLoadingPalette = false;
    }
  }

  private setupPalette(colors: ColorG[]): void {
    this.imageColors = colors;
    this.palette = new BucketPalette(this.imageColors);
    this.events.broadcast(AppEvent.FullPlayerPaletteLoaded, this.palette);
  }

  public onToolbarClose(e: Event): void {
    if (!this.imageToolbarEnabled) {
      return;
    }
    this.imageToolbarEnabled = false;
    e.stopPropagation();
  }

  public onToolbarBack(e: Event): void {
    if (!this.imageToolbarEnabled || this.isLoadingPalette) {
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
    if (!this.imageToolbarEnabled || this.isLoadingPalette) {
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

  public getEllipsisColorVar(): string {
    return `--ellipsis-color: ${this.palette.primary.selected.toRgbaFormula()};`
  }

  public onImageOverlayClick(): void {
    if (this.images.length) {
      this.imageToolbarEnabled = true;
    }
  }
}
