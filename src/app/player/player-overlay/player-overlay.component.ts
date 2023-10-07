import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ColorG } from 'src/app/core/models/color-g.class';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { PlayerSongStatus } from 'src/app/shared/models/player.enum';
import { PlayerOverlayStateService } from './player-overlay-state.service';
import { PlayerOverlayMode } from './player-overlay.enum';
import { IPlayerOverlayModel } from './player-overlay.interface';
import { IFullColorPalette } from 'src/app/shared/services/color-utility/color-utility.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { AppEvent } from 'src/app/app-events';

/**
 * This is the main container of the player and responsible for rendering the selected player mode.
 */
@Component({
  selector: 'sp-player-overlay',
  templateUrl: './player-overlay.component.html',
  styleUrls: ['./player-overlay.component.scss']
})
export class PlayerOverlayComponent extends CoreComponent implements OnInit {
  public PlayerOverlayMode = PlayerOverlayMode;
  public model: IPlayerOverlayModel;
  // TODO: this should have the same color as the small player so the color transition looks better
  public backgroundColor = ColorG.black.rgbFormula;
  constructor(
    private playerOverlayService: PlayerOverlayStateService,
    private events: EventsService,
    private entityService: DatabaseEntitiesService,
    private cd: ChangeDetectorRef,
    private playerService: HtmlPlayerService,
    private utility: UtilityService)
  {
    super();
  }

  ngOnInit(): void {
    this.model = this.playerOverlayService.getState();
    this.subscribeToFullPlayerImageLoaded();
    // Tell the player what to do when the status of a song changes.
    // This component has this responsibility because it lives while the app is running,
    // it is responsible for the visual representation of the player service,
    // and has direct access to the db service.
    this.playerService.getState().playerList.doAfterSongStatusChange = (song, oldStatus) => {
      if (song.playerStatus === PlayerSongStatus.Playing && oldStatus !== PlayerSongStatus.Paused) {
        song.playCount++;
        song.playDate = new Date();
        const days = this.utility.daysFromNow(song.playDate);
        song.recentPlayIcon = this.playerOverlayService.getRecentPlayIcon(days);
        this.entityService.updatePlayCount(song).then(() => {
          this.events.broadcast(AppEvent.PlayerSongUpdated, song);
        });
      }
    };
  }

  public expand() {
    this.playerOverlayService.expand();
  }

  public restore() {
    this.playerOverlayService.restore();
  }

  public small() {
    this.playerOverlayService.getState().mode = PlayerOverlayMode.Small;
  }

  private subscribeToFullPlayerImageLoaded() {
    // TODO: implement color palette, should we do this in the player full?
    this.subs.sink = this.events.onEvent<IFullColorPalette>(AppEvent.FullPlayerPaletteLoaded)
    .subscribe(newPalette => {
      if (this.playerOverlayService.getState().mode === PlayerOverlayMode.Full) {
        this.backgroundColor = newPalette.background.rgbFormula;
        // A simple observable doesn't actually fire change detection so let's do it here
        this.cd.detectChanges();
      }
    });
  }
}
