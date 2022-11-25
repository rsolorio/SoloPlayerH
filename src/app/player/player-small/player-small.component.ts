import { Component } from '@angular/core';
import { AppEvent } from "../../shared/models/events.enum";
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlayerStatus } from 'src/app/shared/models/player.enum';
import { IPlayerState } from 'src/app/shared/models/player.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { PlayerComponentBase } from '../player-component-base.class';
import { PlayerOverlayStateService } from '../player-overlay/player-overlay-state.service';
import { IEventArgs } from 'src/app/core/models/core.interface';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { SongEntity } from 'src/app/shared/entities';

@Component({
  selector: 'sp-player-small',
  templateUrl: './player-small.component.html',
  styleUrls: ['./player-small.component.scss']
})
export class PlayerSmallComponent extends PlayerComponentBase {
  public model: IPlayerState;
  public currentSong: ISongModel;
  public menuList: IMenuModel[] = [];
  public PlayerStatus = PlayerStatus;

  constructor(
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private utilities: UtilityService,
    private events: EventsService
  ) {
    super(playerService, playerOverlayService);
  }

  public ngOnInit() {
    super.ngOnInit();
    this.subs.sink = this.events.onEvent<IEventArgs<IPlaylistSongModel>>(AppEvent.PlaylistCurrentTrackChanged).subscribe(args => {
      SongEntity.findOneBy({ id: args.newValue.id }).then(song => {
        this.currentSong = song;
      });
    });
  }

  protected initializeMenu() {
    this.menuList.push({
      caption: 'Add to playlist...',
      icon: 'mdi mdi-playlist-plus'
    });
    this.menuList.push({
      caption: 'Share...',
      icon: 'mdi mdi-share-variant'
    });
    this.menuList.push({
      caption: 'Log Info',
      icon: 'mdi mdi-file-document-edit-outline',
      action: () => {
        // TODO
      }
    });
  }
}
