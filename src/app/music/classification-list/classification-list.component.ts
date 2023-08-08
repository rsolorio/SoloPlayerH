import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { RelatedImageEntity, SongClassificationViewEntity } from 'src/app/shared/entities';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ClassificationListBroadcastService } from './classification-list-broadcast.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { IImage } from 'src/app/core/models/core.interface';
import { RelatedImageSrc } from 'src/app/shared/services/database/database.seed';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { ImageService } from 'src/app/platform/image/image.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';

@Component({
  selector: 'sp-classification-list',
  templateUrl: './classification-list.component.html',
  styleUrls: ['./classification-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassificationListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public isGenreList = false;

  // START - LIST MODEL
  private albumArtistRoute = appRoutes[AppRoute.AlbumArtists];
  private albumRoute = appRoutes[AppRoute.Albums];
  private songRoute = appRoutes[AppRoute.Songs];
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.ClassificationListUpdated,
    itemMenuList: [
      {
        caption: 'Play',
        icon: 'mdi-play mdi',
        action: () => {}
      },
      {
        caption: 'Toggle Selection',
        icon: 'mdi-select mdi',
        action: (menuItem, param) => {
          this.spListBaseComponent.toggleSelection(param);
        }
      },
      {
        isSeparator: true
      },
      {
        caption: this.albumArtistRoute.name,
        icon: this.albumArtistRoute.icon,
        action: (menuItem, param) => {
          const classification = param as IClassificationModel;
          if (classification) {
            this.showEntity(this.albumArtistRoute, classification);
          }
        }
      },
      {
        caption: this.albumRoute.name,
        icon: this.albumRoute.icon,
        action: (menuItem, param) => {
          const classification = param as IClassificationModel;
          if (classification) {
            this.showEntity(this.albumRoute, classification);
          }
        }
      },
      {
        caption: this.songRoute.name,
        icon: this.songRoute.icon,
        action: (menuItem, param) => {
          const classification = param as IClassificationModel;
          if (classification) {
            this.showEntity(this.songRoute, classification);
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
      const classification = item as IClassificationModel;
      if (!classification.image.src && !classification.image.getImage) {
        classification.image.getImage = () => this.getClassificationImage(classification);
      }
    }
  };

  // END - LIST MODEL

  constructor(
    public broadcastService: ClassificationListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private navigation: NavigationService,
    private db: DatabaseService,
    private imageService: ImageService,
    private entities: DatabaseEntitiesService
  ) {
    super();
    this.isGenreList = this.utility.isRouteActive(AppRoute.Genres);
    this.broadcastService.isGenreList = this.isGenreList;
  }

  ngOnInit(): void {
  }

  public onItemContentClick(classification: IClassificationModel): void {
    this.onClassificationClick(classification);
  }

  private onClassificationClick(classification: IClassificationModel): void {
    this.showEntity(appRoutes[AppRoute.AlbumArtists], classification);
  }

  public onShowSongsClick(classification: IClassificationModel): void {
    this.showEntity(appRoutes[AppRoute.Songs], classification);
  }

  private addBreadcrumb(classification: IClassificationModel): void {
    const criteriaItem = new CriteriaItem('classificationId', classification.id);
    criteriaItem.displayName = classification.classificationType;
    criteriaItem.columnValues[0].caption = classification.name;
    criteriaItem.ignoreInSelect = true;
    const selectedItems = this.spListBaseComponent.getSelectedItems();
    if (selectedItems.length) {
      for (const item of selectedItems) {
        const classificationItem = item as IClassificationModel;
        criteriaItem.columnValues.push({
          value: classificationItem.id,
          caption: classificationItem.name
        });
      }
    }
    // Suppress event so this component doesn't react to this change;
    // these breadcrumbs are for another list that hasn't been loaded yet
    this.breadcrumbService.addOne({
      criteriaItem: criteriaItem,
      origin: BreadcrumbSource.Classification
    }, { suppressEvents: true });
  }

  private showEntity(routeInfo: IAppRouteInfo, classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    // No specific criteria, breadcrumbs will be automatically taken by the new entity
    const criteria = new Criteria('Search Results');
    this.navigation.forward(routeInfo.route, { criteria: criteria });
  }

  private async getClassificationImage(classification: IClassificationModel): Promise<IImage> {
    // Get one random song with this classification
    const criteria = new Criteria('Search Results');
    criteria.random = true;
    criteria.paging.pageSize = 1;
    const criteriaValue = new CriteriaItem('classificationId', classification.id);
    criteria.searchCriteria.push(criteriaValue);
    const songList = await this.db.getList(SongClassificationViewEntity, criteria);
    if (songList && songList.length) {
      const song = songList[0];
      const relatedImage = await this.entities.getRelatedImage([song.id, song.primaryAlbumId]);
      if (relatedImage) {
        return this.imageService.getImageFromSource(relatedImage);
      }
    }
    return {
      src: RelatedImageSrc.DefaultLarge,
      srcType: ImageSrcType.WebUrl
    };
  }
}
