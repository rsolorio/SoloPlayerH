import { Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { PromiseQueueService } from 'src/app/core/services/promise-queue/promise-queue.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { AlbumViewEntity, RelatedImageEntity } from 'src/app/shared/entities';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { ImageUtilityService } from 'src/app/related-image/image-utility/image-utility.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AlbumListBroadcastService } from './album-list-broadcast.service';

@Component({
  selector: 'sp-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.scss']
})
export class AlbumListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];

  constructor(
    public broadcastService: AlbumListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private db: DatabaseService,
    private queueService: PromiseQueueService,
    private navigation: NavigationService,
    private imageUtility: ImageUtilityService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initializeItemMenu();
  }

  private initializeItemMenu(): void {
    this.itemMenuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.itemMenuList.push({
      caption: 'Select/Unselect',
      icon: 'mdi-select mdi',
      action: param => {
        const album = param as IAlbumModel;
        album.selected = !album.selected;
      }
    });

    this.itemMenuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const albumModel = param as IAlbumModel;
        this.utility.googleSearch(`${albumModel.artistName} ${albumModel.name}`);
      }
    });

    this.itemMenuList.push({
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const album = param as IAlbumModel;
        if (album) {
          this.navigation.forward(AppRoute.Albums, { queryParams: [album.id] });
        }
      }
    });

    this.itemMenuList.push({
      isSeparator: true,
      caption: null
    });

    const songRoute = appRoutes[AppRoute.Songs];
    this.itemMenuList.push({
      caption: songRoute.name,
      icon: songRoute.icon,
      action: param => {
        const album = param as IAlbumModel;
          if (album) {
            this.showEntity(songRoute, album);
          }
      }
    });
  }

  public onItemContentClick(album: IAlbumModel): void {
    this.onAlbumClick(album);
  }

  private onAlbumClick(album: IAlbumModel): void {
    this.showEntity(appRoutes[AppRoute.Songs], album);
  }

  private addBreadcrumb(album: IAlbumModel): void {
    // Automatically add the Album Artist breadcrumb if it does not exist
    let hasAlbumArtist = false;
    const breadcrumbs = this.breadcrumbService.getState();
    for (const breadcrumb of breadcrumbs) {
      if (breadcrumb.criteriaItem.columnName === 'primaryArtistId') {
        hasAlbumArtist = true;
      }
    }
    if (!hasAlbumArtist) {
      const albumView = album as AlbumViewEntity;
      if (albumView && albumView.primaryArtistId) {
        const criteriaItem = new CriteriaItem('primaryArtistId', albumView.primaryArtistId);
        criteriaItem.displayName = this.db.displayName(criteriaItem.columnName);
        criteriaItem.columnValues[0].caption = album.artistName;
        // Suppress event so this component doesn't react to this change;
        // these breadcrumbs are for another list that hasn't been loaded yet
        this.breadcrumbService.addOne({
          criteriaItem: criteriaItem,
          origin: BreadcrumbSource.AlbumArtist
        }, { suppressEvents: true });
      }
    }

    // TODO: handle multiple selected albums
    const criteriaItem = new CriteriaItem('primaryAlbumId', album.id);
    criteriaItem.displayName = this.db.displayName(criteriaItem.columnName);
    criteriaItem.columnValues[0].caption = album.name;
    // Suppress event so this component doesn't react to this change;
    // these breadcrumbs are for another list that hasn't been loaded yet
    this.breadcrumbService.addOne({
      criteriaItem: criteriaItem,
      origin: BreadcrumbSource.Album
    }, { suppressEvents: true });
  }

  private showEntity(routeInfo: IAppRouteInfo, album: IAlbumModel): void {
    this.addBreadcrumb(album);
    // No specific criteria, breadcrumbs will be automatically taken by the new entity
    const criteria = new Criteria('Search Results');
    this.navigation.forward(routeInfo.route, { criteria: criteria });
  }

  public onListInitialized(): void {
  }

  public onItemRender(album: IAlbumModel): void {
    if (!album.recentIcon) {
      const days = this.utility.differenceInDays(new Date(), new Date(album.songAddDateMax));
      album.recentIcon = this.spListBaseComponent.getRecentIcon(days);
    }
    if (!album.image.src) {
      this.queueService.sink = () => this.setAlbumImage(album);
    }
  }

  private async setAlbumImage(album: IAlbumModel): Promise<void> {
    const images = await RelatedImageEntity.findBy({ relatedId: album.id });
    if (images && images.length) {
      const relatedImage = images[0];
      await this.imageUtility.setSrc([relatedImage]);
      album.image = {
        src: relatedImage.src,
        srcType: relatedImage.srcType
      };
    }
  }
}
