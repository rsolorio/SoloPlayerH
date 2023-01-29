import { Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ClassificationListBroadcastService } from './classification-list-broadcast.service';

@Component({
  selector: 'sp-classification-list',
  templateUrl: './classification-list.component.html',
  styleUrls: ['./classification-list.component.scss']
})
export class ClassificationListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];
  public isGenreList = false;

  constructor(
    public broadcastService: ClassificationListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private navigation: NavigationService
  ) {
    super();
    this.isGenreList = this.utility.isRouteActive(AppRoute.Genres);
    this.broadcastService.isGenreList = this.isGenreList;
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
        const classification = param as IClassificationModel;
        classification.selected = !classification.selected;
      }
    });

    this.itemMenuList.push({
      isSeparator: true,
      caption: null
    });

    const albumArtistRoute = appRoutes[AppRoute.AlbumArtists];
    this.itemMenuList.push({
      caption: albumArtistRoute.name,
      icon: albumArtistRoute.icon,
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showEntity(albumArtistRoute, classification);
        }
      }
    });

    const albumRoute = appRoutes[AppRoute.Albums];
    this.itemMenuList.push({
      caption: albumRoute.name,
      icon: albumRoute.icon,
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showEntity(albumRoute, classification);
        }
      }
    });

    const songRoute = appRoutes[AppRoute.Songs];
    this.itemMenuList.push({
      caption: songRoute.name,
      icon: songRoute.icon,
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showEntity(songRoute, classification);
        }
      }
    });
  }

  public onItemContentClick(classification: IClassificationModel): void {
    this.onClassificationClick(classification);
  }

  private onClassificationClick(classification: IClassificationModel): void {
    this.showEntity(appRoutes[AppRoute.AlbumArtists], classification);
  }

  private addBreadcrumb(classification: IClassificationModel): void {
    const criteria: ICriteriaValueBaseModel[] = [];
    const criteriaValue = new CriteriaValueBase('classificationId', classification.id);
    criteriaValue.DisplayName = classification.classificationType;
    criteriaValue.DisplayValue = classification.name;
    criteriaValue.IgnoreInSelect = true;
    criteria.push(criteriaValue);
    const selectedItems = this.spListBaseComponent.getSelectedItems();
    if (selectedItems.length) {
      for (const item of selectedItems) {
        const classificationItem = item as IClassificationModel;
        const criteriaItem = new CriteriaValueBase('classificationId', classificationItem.id);
        criteriaItem.DisplayName = classificationItem.classificationType;
        criteriaItem.DisplayValue = classificationItem.name;
        criteriaItem.IgnoreInSelect = true;
        criteria.push(criteriaItem);
      }
    }
    // Suppress event so this component doesn't react to this change;
    // these breadcrumbs are for another list that hasn't been loaded yet
    this.breadcrumbService.addOne({
      criteriaList: criteria,
      origin: BreadcrumbSource.Classification
    }, { suppressEvents: true });
  }

  private showEntity(routeInfo: IAppRouteInfo, classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    // The only query information that will pass from one entity to another is breadcrumbs
    const query = new QueryModel<any>();
    query.breadcrumbCriteria = this.breadcrumbService.getCriteriaClone();
    this.navigation.forward(routeInfo.route, { query: query });
  }

  public onListInitialized(): void {
  }

  public onBeforeBroadcast(query: QueryModel<IClassificationModel>): void {
    this.removeUnsupportedBreadcrumbs(query);
  }

  private removeUnsupportedBreadcrumbs(query: QueryModel<IClassificationModel>): void {
    // Classifications/genres do not support any kind of breadcrumbs
    this.breadcrumbService.clear();
    // Now that breadcrumbs are updated, reflect the change in the query
    // which will be used to broadcast
    query.breadcrumbCriteria = [];
  }
}
