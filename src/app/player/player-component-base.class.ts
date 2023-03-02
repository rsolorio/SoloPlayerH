import { OnInit, Directive } from '@angular/core';

import { IMenuModel } from '../core/models/menu-model.interface';
import { PlayerOverlayStateService } from './player-overlay/player-overlay-state.service';
import { CoreComponent } from '../core/models/core-component.class';
import { IPlayerState } from '../shared/models/player.interface';
import { PlayerStatus, PlayMode, RepeatMode } from '../shared/models/player.enum';
import { HtmlPlayerService } from '../shared/services/html-player/html-player.service';
import { MenuService } from '../core/services/menu/menu.service';
import { EventsService } from '../core/services/events/events.service';
import { AppEvent } from '../shared/models/events.enum';
import { IEventArgs } from '../core/models/core.interface';
import { IPlaylistSongModel } from '../shared/models/playlist-song-model.interface';
import { DatabaseService } from '../shared/services/database/database.service';
import { ISongModel } from '../shared/models/song-model.interface';
import { DialogService } from '../shared/services/dialog/dialog.service';
import { UtilityService } from '../core/services/utility/utility.service';

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
    private playerOverlayServiceBase: PlayerOverlayStateService,
    private eventService: EventsService,
    private menuServiceBase: MenuService,
    private database: DatabaseService,
    private dialogService: DialogService,
    private utilityService: UtilityService)
  {
    super();
  }

  public get song(): ISongModel {
    return this.model.playerList.current.song;
  }

  public ngOnInit() {
    this.onInit();
  }

  public onInit() {
    this.model = this.playerServiceBase.getState();
    this.initializeMenu();
    if (this.model.playerList.hasTrack()) {
      this.setupAssociatedData(this.model.playerList.current.song.id);
    }
    this.subs.sink = this.eventService.onEvent<IEventArgs<IPlaylistSongModel>>(AppEvent.PlaylistCurrentTrackChanged).subscribe(eventArgs => {
      this.setupAssociatedData(eventArgs.newValue.song.id);
    });
  }

  protected initializeMenu() {
    // TODO: this should not be displayed in cordova mode
    this.menuList.push({
      caption: 'Mobile Size',
      icon: 'mdi-cellphone mdi',
      action: () => {
        this.dialogService.resizeWindow(this.utilityService.getSmallFormFactor());
      }
    });
  }

  /**
   * Setups any data associated with the specified song.
   * @param songId 
   */
  protected async setupAssociatedData(songId: string): Promise<void> {
  }

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

  public onFavoriteClick(song: ISongModel) {
    const newValue = !song.favorite;
    this.database.setFavoriteSong(song.id, newValue).then(() => {
      song.favorite = newValue;
    });
  }

  public onTogglePlaylist() {
    this.model.playerList.isVisible = !this.model.playerList.isVisible;
  }

  public onCollapseClick() {
    this.menuServiceBase.hideSlideMenu();
    this.model.playerList.isVisible = false;
    this.playerOverlayServiceBase.restore();
  }

  public onRatingChange(e: IEventArgs<number>, song: ISongModel): void {
    if (e.oldValue === e.newValue) {
      return;
    }
    this.database.setRating(song.id, song.rating);
  }
}