import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { AlbumListBroadcastService } from './album-list-broadcast.service';
import { AlbumListStateService } from './album-list-state.service';

@Component({
  selector: 'sp-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.scss']
})
export class AlbumListComponent extends CoreComponent implements OnInit {

  public model: IPaginationModel<IAlbumModel> = {
    items: []
  };
  /** This is the menu of each artist item */
  public menuList: IMenuModel[] = [];

  constructor(
    private stateService: AlbumListStateService,
    private events: EventsService,
    private broadcastService: AlbumListBroadcastService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadingService.show();
    this.initializeMenu();

    this.subs.sink = this.events.onEvent<IPaginationModel<IAlbumModel>>(AppEvent.AlbumListUpdated).subscribe(response => {
      this.model = response;
      this.loadingService.hide();
    });

    const pagination: IPaginationModel<IAlbumModel> = {
      items: [],
      criteria: null,
      name: null
    };
    this.broadcastService.getAndBroadcast(pagination).subscribe();
  }

  private initializeMenu(): void {
    this.menuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.menuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const albumModel = param as IAlbumModel;
        this.utility.googleSearch(albumModel.name);
      }
    });

    this.menuList.push({
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

  public onAlbumClick(): void {}

  public onIntersectionChange(isIntersecting: boolean, album: IAlbumModel): void {
    // console.log(isIntersecting);
    // console.log(artist);

    album.canBeRendered = isIntersecting;
    if (isIntersecting && !album.imageSrc) {
      // TODO: logic for getting artist image
      album.imageSrc = '../assets/img/default-image-small.jpg';
    }
  }

}
