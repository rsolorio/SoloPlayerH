import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerStatus } from 'src/app/shared/models/player.enum';
import { IPlayerStatusChangedEventArgs } from 'src/app/shared/models/player.interface';
import { PlayerOverlayStateService } from './player-overlay-state.service';
import { PlayerOverlayMode } from './player-overlay.enum';
import { IPlayerOverlayModel } from './player-overlay.interface';

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
  constructor(
    private playerOverlayService: PlayerOverlayStateService,
    private events: EventsService
  ) {
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
            // TODO: increase play count in the db and/or file
          }
          break;
      }
    });
  }

  private subscribeToFullPlayerImageLoaded() {
    // TODO: implement color palette, should we do this in the player full?
    // this.subs.sink = this.events.onEvent<IBucketPalette>(AppEvent.FullPlayerPaletteLoaded)
    // .subscribe(newPalette => {
    //   if (this.playerOverlayService.getState().mode === PlayerOverlayMode.Full) {
    //     this.backgroundColor = newPalette.background.selected.rgbFormula;
    //     // A simple observable doesn't actually fire change detection so let's do it here
    //     this.cd.detectChanges();
    //   }
    // });
  }
}
