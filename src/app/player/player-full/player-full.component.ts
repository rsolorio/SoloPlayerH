import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { IColorExtractionData } from 'src/app/core/models/color-extractor-factory.class';
import { ColorG, IColorG } from 'src/app/core/models/color-g.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { WorkerName, WorkerService } from 'src/app/core/services/worker/worker.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerStatus, PlayMode, RepeatMode } from 'src/app/shared/models/player.enum';
import { BucketPalette } from 'src/app/shared/services/color-utility/color-utility.class';
import { ColorUtilityService } from 'src/app/shared/services/color-utility/color-utility.service';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { PlayerComponentBase } from '../player-component-base.class';
import { PlayerOverlayStateService } from '../player-overlay/player-overlay-state.service';

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
  private imageColors: ColorG[];
  public isLoadingPalette = false;
  constructor(
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private menuService: MenuService,
    private colorUtility: ColorUtilityService,
    private worker: WorkerService,
    private events: EventsService,
    private cd: ChangeDetectorRef)
  {
    super(playerService, playerOverlayService, menuService);
  }

  public onInit(): void {
    super.onInit();
    this.setupPalette(this.colorUtility.getDefaultColors());
  }

  public onImageLoad(): void {
    this.loadPalette();
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
}
