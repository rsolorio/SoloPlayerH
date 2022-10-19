import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { AlbumListBroadcastService } from './album-list-broadcast.service';

@Component({
  selector: 'sp-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.scss']
})
export class AlbumListComponent extends CoreComponent implements OnInit {

  public appEvent = AppEvent;

  public model: IPaginationModel<IAlbumModel> = {
    items: []
  };
  /** This is the menu of each item */
  public itemMenuList: IMenuModel[] = [];

  constructor(
    private broadcastService: AlbumListBroadcastService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initializeMenu();
  }

  private initializeMenu(): void {
    this.itemMenuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.itemMenuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const albumModel = param as IAlbumModel;
        this.utility.googleSearch(albumModel.name);
      }
    });

    this.itemMenuList.push({
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const album = param as IAlbumModel;
        if (album) {
          this.utility.navigateWithRouteParams(AppRoutes.Albums, [album.id]);
        }
      }
    });
  }

  public onSearch(searchTerm: string): void {
    console.log(searchTerm);
  }

  public onFavoriteClick(): void {}

  public onItemContentClick(): void {}

  public onInitialized(): void {
    this.loadingService.show();
    const pagination: IPaginationModel<IAlbumModel> = {
      items: [],
      criteria: null,
      name: null
    };
    this.broadcastService.getAndBroadcast(pagination).subscribe();
  }

}
