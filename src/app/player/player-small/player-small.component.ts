import { Component } from '@angular/core';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IPlayerState } from 'src/app/shared/models/player.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { PlayerComponentBase } from '../player-component-base.class';
import { PlayerOverlayStateService } from '../player-overlay/player-overlay-state.service';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { DialogService } from 'src/app/platform/dialog/dialog.service';
import { ImageService } from 'src/app/platform/image/image.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { AppActionIcons, AppViewIcons } from 'src/app/app-icons';
import { LastFmService } from 'src/app/shared/services/last-fm/last-fm.service';
import { LogService } from 'src/app/core/services/log/log.service';

@Component({
  selector: 'sp-player-small',
  templateUrl: './player-small.component.html',
  styleUrls: ['./player-small.component.scss']
})
export class PlayerSmallComponent extends PlayerComponentBase {
  public model: IPlayerState;
  public menuList: IMenuModel[] = [];

  constructor(
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private utilities: UtilityService,
    private events: EventsService,
    private menuService: MenuService,
    private entityService: DatabaseEntitiesService,
    private dialog: DialogService,
    private sidebarHostService: SideBarHostStateService,
    private imageService: ImageService,
    private options: DatabaseOptionsService,
    private lastFm: LastFmService,
    private log: LogService)
  {
    super(playerService, playerOverlayService, events, menuService, entityService, dialog, utilities, sidebarHostService, imageService, options, lastFm, log);
  }

  public ngOnInit() {
    super.ngOnInit();
  }

  protected initializeMenu() {
    this.menuList.push({
      caption: 'Add to playlist...',
      icon: AppActionIcons.AddToPlaylist
    });
    this.menuList.push({
      caption: 'Share...',
      icon: AppActionIcons.Share
    });
    this.menuList.push({
      caption: 'Log Info',
      icon: AppViewIcons.Log,
      action: () => {
        // TODO
      }
    });
  }
}
