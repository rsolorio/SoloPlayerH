import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';
import { CoreComponent } from 'src/app/core/models/core-component.class';
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
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AlbumListBroadcastService } from './album-list-broadcast.service';
import { ImageService } from 'src/app/platform/image/image.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { IImage } from 'src/app/core/models/core.interface';
import { RelatedImageSrc } from 'src/app/shared/services/database/database.seed';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';

@Component({
  selector: 'sp-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlbumListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;

  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.AlbumListUpdated,
    itemMenuList: [
      {
        caption: 'Play',
        icon: 'mdi-play mdi',
        action: param => {}
      },
      {
        caption: 'Toggle Selection',
        icon: 'mdi-select mdi',
        action: param => {
          this.spListBaseComponent.toggleSelection(param);
        }
      },
      {
        caption: 'Search...',
        icon: 'mdi-web mdi',
        action: param => {
          const albumModel = param as IAlbumModel;
          this.utility.googleSearch(`${albumModel.artistName} ${albumModel.name}`);
        }
      },
      {
        caption: 'Properties...',
        icon: 'mdi-square-edit-outline mdi',
        action: param => {
          const album = param as IAlbumModel;
          if (album) {
            this.navigation.forward(AppRoute.Albums, { queryParams: [album.id] });
          }
        }
      },
      {
        isSeparator: true,
        caption: null
      },
      {
        caption: appRoutes[AppRoute.Songs].name,
        icon: appRoutes[AppRoute.Songs].icon,
        action: param => {
          const album = param as IAlbumModel;
            if (album) {
              this.showEntity(appRoutes[AppRoute.Songs], album);
            }
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService,
    prepareItemRender: item => {
      const album = item as IAlbumModel;
      if (!album.recentIcon) {
        const days = this.utility.daysFromNow(new Date(album.songAddDateMax));
        album.recentIcon = this.spListBaseComponent.getRecentIcon(days);
      }
      if (!album.image.src && !album.image.getImage) {
        album.image.getImage = () => this.getAlbumImage(album);
      }
    }
  };
  // END - LIST MODEL

  constructor(
    public broadcastService: AlbumListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private db: DatabaseService,
    private entities: DatabaseEntitiesService,
    private navigation: NavigationService,
    private imageService: ImageService
  ) {
    super();
  }

  ngOnInit(): void {
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

  private async getAlbumImage(album: IAlbumModel): Promise<IImage> {
    const relatedImage = await this.entities.getRelatedImage([album.id]);
    if (relatedImage) {
      return this.imageService.getImageFromSource(relatedImage);
    }
    return {
      src: RelatedImageSrc.DefaultLarge,
      srcType: ImageSrcType.WebUrl
    };
  }
}
