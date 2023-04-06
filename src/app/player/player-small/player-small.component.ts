import { Component } from '@angular/core';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlayerStatus } from 'src/app/shared/models/player.enum';
import { IPlayerState } from 'src/app/shared/models/player.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { PlayerComponentBase } from '../player-component-base.class';
import { PlayerOverlayStateService } from '../player-overlay/player-overlay-state.service';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { DialogService } from 'src/app/platform/dialog/dialog.service';
import { ValueListSelectorService } from 'src/app/value-list/value-list-selector/value-list-selector.service';
import { ImagePreviewService } from 'src/app/related-image/image-preview/image-preview.service';
import { ImageService } from 'src/app/platform/image/image.service';

@Component({
  selector: 'sp-player-small',
  templateUrl: './player-small.component.html',
  styleUrls: ['./player-small.component.scss']
})
export class PlayerSmallComponent extends PlayerComponentBase {
  public model: IPlayerState;
  public menuList: IMenuModel[] = [];
  public PlayerStatus = PlayerStatus;

  constructor(
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private utilities: UtilityService,
    private events: EventsService,
    private menuService: MenuService,
    private db: DatabaseService,
    private dialog: DialogService,
    private imagePreview: ImagePreviewService,
    private valueListService: ValueListSelectorService,
    private imageService: ImageService)
  {
    super(playerService, playerOverlayService, events, menuService, db, dialog, utilities, imagePreview, valueListService, imageService);
  }

  public ngOnInit() {
    super.ngOnInit();
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
