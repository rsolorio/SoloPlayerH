import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ColorG } from 'src/app/core/models/color-g.class';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerStatus } from 'src/app/shared/models/player.enum';
import { IPlayerStatusChangedEventArgs } from 'src/app/shared/models/player.interface';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { PlayerOverlayStateService } from './player-overlay-state.service';
import { PlayerOverlayMode } from './player-overlay.enum';
import { IPlayerOverlayModel } from './player-overlay.interface';
import { IFullColorPalette } from 'src/app/shared/services/color-utility/color-utility.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

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
    private db: DatabaseService,
    private cd: ChangeDetectorRef,
    private utility: UtilityService)
  {
    super();
  }

  ngOnInit(): void {
    this.model = this.playerOverlayService.getState();
    this.subscribeToPlayerStatusChanged();
    this.subscribeToFullPlayerImageLoaded();
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

  private subscribeToPlayerStatusChanged() {
    // TODO: why this component has this responsibility?
    this.subs.sink = this.events.onEvent<IPlayerStatusChangedEventArgs>(AppEvent.PlayerStatusChanged)
    .subscribe(eventArgs => {
      switch (eventArgs.newValue) {
        case PlayerStatus.Playing:
          if (eventArgs.oldValue !== PlayerStatus.Paused) {
            this.db.increasePlayCount(eventArgs.track.songId).then(updatedSong => {
              eventArgs.track.song.playCount = updatedSong.playCount;
              eventArgs.track.song.playDate = updatedSong.playDate;
              const days = this.utility.daysFromNow(new Date(eventArgs.track.song.playDate));
              eventArgs.track.song.popularityIcon = this.playerOverlayService.getPopularityIcon(days);
            });
          }
          break;
      }
    });
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
