import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { SongClassificationViewEntity } from 'src/app/shared/entities';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ClassificationListBroadcastService } from './classification-list-broadcast.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { IImage } from 'src/app/core/models/core.interface';
import { RelatedImageSrc } from 'src/app/shared/services/database/database.seed';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { ImageService } from 'src/app/platform/image/image.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons, AppPlayerIcons } from 'src/app/app-icons';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { ValueLists } from 'src/app/shared/services/database/database.lists';
import { AppEvent } from 'src/app/app-events';

@Component({
  selector: 'sp-classification-list',
  templateUrl: './classification-list.component.html',
  styleUrls: ['./classification-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassificationListComponent extends CoreComponent implements OnInit {
  public AppAttributeIcons = AppAttributeIcons;
  public AppEntityIcons = AppEntityIcons;
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  private albumArtistRoute = appRoutes[AppRoute.AlbumArtists];
  private albumRoute = appRoutes[AppRoute.Albums];
  private songRoute = appRoutes[AppRoute.Songs];

  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.ClassificationListUpdated,
    itemMenuList: [
      {
        caption: 'Play',
        icon: AppPlayerIcons.Play,
        action: () => {}
      },
      {
        caption: 'Toggle Selection',
        icon: AppActionIcons.Select,
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
    rightIcons: [
      {
        icon: AppActionIcons.Sort,
        action: () => {
          this.openSortingPanel();
        }
      },
      {
        id: 'quickFilterIcon',
        icon: AppActionIcons.Filter + ' sp-color-primary',
        action: () => {
          this.openQuickFilterPanel();
        },
        off: true,
        offIcon: AppActionIcons.Filter,
        offAction: () => {
          this.openQuickFilterPanel();
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    searchIconEnabled: true,
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
    private entities: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private sidebarHostService: SideBarHostStateService,
  ) {
    super();
    const isGenreList = this.utility.isRouteActive(AppRoute.Genres);
    if (isGenreList) {
      const criteriaItem = new CriteriaItem('classificationTypeId', ValueLists.Genre.id);
      criteriaItem.id = 'quickFilter-genre';
      criteriaItem.displayName = 'Genre';
      criteriaItem.displayValue = 'Yes';
      this.listModel.criteriaResult.criteria.quickCriteria.push(criteriaItem);
    }
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
      icon: AppEntityIcons.Classification,
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

  public openQuickFilterPanel(): void {
    const chips = this.entities.getQuickFiltersForClassifications(this.spListBaseComponent.model.criteriaResult.criteria);
    const model = this.entities.getQuickFilterPanelModel(chips, 'Classifications', AppEntityIcons.Classification);
    model.onOk = okResult => {
      const criteria = new Criteria(model.title);
      // Keep sorting criteria
      criteria.sortingCriteria = this.spListBaseComponent.model.criteriaResult.criteria.sortingCriteria;
      // Add search criteria
      for (const valuePair of okResult.items) {
        if (valuePair.selected) {
          const criteriaItem = valuePair.value as CriteriaItem;
          criteria.quickCriteria.push(criteriaItem);
        }
      }
      this.spListBaseComponent.send(criteria);
    };
    this.sidebarHostService.loadContent(model);
  }

  public onListUpdated(model: IListBaseModel): void {
    const navbarState = this.navbarService.getState();
    const iconOff = !model.criteriaResult.criteria.quickCriteria.hasComparison();
    navbarState.rightIcons.find(i => i.id === 'quickFilterIcon').off = iconOff;

    // Update the title accordingly    
    if (model.criteriaResult.criteria.quickCriteria.length === 1) {
      // get the info from the chips
      const chips = this.entities.getQuickFiltersForClassifications(this.spListBaseComponent.model.criteriaResult.criteria);
      // Whatever type is selected
      for (const chip of chips) {
        const criteriaItem = chip.value as CriteriaItem;
        if (criteriaItem.id === model.criteriaResult.criteria.quickCriteria[0].id) {
          navbarState.title = chip.caption;
          navbarState.leftIcon.icon = chip.icon;
        }
      }
    }
    else {
      // Classifications
      const route = appRoutes[AppRoute.Classifications];
      navbarState.title = route.name;
      navbarState.leftIcon.icon = route.icon;
    }
  }

  private openSortingPanel(): void {
    const chips = this.entities.getSortingForClassifications(this.spListBaseComponent.model.criteriaResult.criteria);
    const model = this.entities.getSortingPanelModel(chips, 'Classifications', AppEntityIcons.Classification);
    model.onOk = okResult => {
      const criteria = new Criteria(model.title);
      // Keep quick criteria
      criteria.quickCriteria = this.spListBaseComponent.model.criteriaResult.criteria.quickCriteria;
      // Add sorting criteria, we only support one item
      const chipItem = okResult.items.find(i => i.selected);
      if (chipItem) {
        const criteriaItems = chipItem.value as CriteriaItems;
        criteria.sortingCriteria = criteriaItems;
      }
      else {
        criteria.sortingCriteria = new CriteriaItems();
      }
      this.spListBaseComponent.send(criteria);
    };
    this.sidebarHostService.loadContent(model);
  }
}
