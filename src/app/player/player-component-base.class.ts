import { OnInit, Directive } from '@angular/core';

import { IMenuModel } from '../core/models/menu-model.interface';
import { PlayerOverlayStateService } from './player-overlay/player-overlay-state.service';
import { CoreComponent } from '../core/models/core-component.class';
import { IPlayerState } from '../shared/models/player.interface';
import { PlayerStatus, PlayMode, RepeatMode } from '../shared/models/player.enum';
import { HtmlPlayerService } from '../shared/services/html-player/html-player.service';

/**
 * Base component for any implementation of the player modes.
 * Decorated with a directive just to allow the class use Angular features.
 */
@Directive()
// tslint:disable:directive-class-suffix
export class PlayerComponentBase extends CoreComponent implements OnInit {
  public model: IPlayerState;
  public menuList: IMenuModel[] = [];
  public PlayerStatus = PlayerStatus;
  public RepeatMode = RepeatMode;
  public PlayMode = PlayMode;

  constructor(
    private playerServiceBase: HtmlPlayerService,
    private playerOverlayServiceBase: PlayerOverlayStateService) {
      super();
    }

  public ngOnInit() {
    this.onInit();
  }

  public onInit() {
    this.model = this.playerServiceBase.getState();
    this.initializeMenu();
  }

  protected initializeMenu() {}

  // Public Methods ****************************************************************************
  public onSongInfoClick() {
    if (this.model.playerList.hasTrack()) {
      this.playerOverlayServiceBase.expand();
    }
  }

  public onPlayPause() {
    this.playerServiceBase.togglePlay();
  }

  public onPrevious() {
    this.playerServiceBase.playPrevious(5);
  }

  public onForward() {
    this.playerServiceBase.playNext();
  }

  public onToggleFavorite() {
  }

  public onTogglePlaylist() {
    this.model.playerList.isVisible = !this.model.playerList.isVisible;
  }
}