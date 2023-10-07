import { Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute } from 'src/app/app-routes';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { IFilterModel } from 'src/app/shared/models/filter-model.interface';
import { FilterListBroadcastService } from './filter-list-broadcast.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { Criteria, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { AppEvent } from 'src/app/app-events';

@Component({
  selector: 'sp-filter-list',
  templateUrl: './filter-list.component.html',
  styleUrls: ['./filter-list.component.scss']
})
export class FilterListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public AppAttributeIcons = AppAttributeIcons;
  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.FilterListUpdated,
    itemMenuList: [
      {
        caption: 'Properties...',
        icon: AppActionIcons.Edit,
        action: (menuItem, param) => {
          const filter = param as IFilterModel;
          if (filter) {
            this.navigation.forward(AppRoute.Filters, { routeParams: [filter.id] });
          }
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    rightIcons: [
      {
        icon: AppActionIcons.Add,
        action: () => { }
      },
      {
        id: 'sortIcon',
        icon: AppActionIcons.Sort,
        action: () => {
          this.openSortingPanel();
        }
      }
    ],
    searchIconEnabled: true,
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService
  };  
  // END - LIST MODEL

  constructor(
    public broadcastService: FilterListBroadcastService,
    private navigation: NavigationService,
    private sidebarHostService: SideBarHostStateService,
    private entities: DatabaseEntitiesService
  ) {
    super();
  }

  ngOnInit(): void {
  }

  public onItemContentClick(filter: IFilterModel): void {
    this.entities.updateFilterAccessDate(filter.id).then(() => {
      this.entities.getCriteriaFromFilter(filter).then(criteria => {
        this.navigation.forward(AppRoute.Songs, { criteria: criteria });
      });
    });
  }

  public onFavoriteClick(e: Event, filter: IFilterModel): void {
    // If we don't stop, the onItemContentClick will be fired
    e.stopImmediatePropagation();
    // Setting the favorite before updating the db since the promise
    // will break the change detection cycle and the change will not be reflected in the UI
    filter.favorite = !filter.favorite;
    this.entities.setFavoriteFilter(filter.id, filter.favorite);
  }

  private openSortingPanel(): void {
    const chips = this.entities.getSortingForFilters(this.spListBaseComponent.model.criteriaResult.criteria);
    const model = this.entities.getSortingPanelModel(chips, 'Smartlists', AppEntityIcons.Smartlist);
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
