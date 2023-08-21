import { Component, OnInit } from '@angular/core';
import { AppRoute } from 'src/app/app-routes';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IFilterModel } from 'src/app/shared/models/filter-model.interface';
import { FilterListBroadcastService } from './filter-list-broadcast.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { Criteria } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { AppActionIcons } from 'src/app/app-icons';

@Component({
  selector: 'sp-filter-list',
  templateUrl: './filter-list.component.html',
  styleUrls: ['./filter-list.component.scss']
})
export class FilterListComponent extends CoreComponent implements OnInit {

    // START - LIST MODEL
    public listModel: IListBaseModel = {
      listUpdatedEvent: AppEvent.FilterListUpdated,
      itemMenuList: [
        {
          caption: 'Properties...',
          icon: 'mdi-square-edit-outline mdi',
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
      rightIcons: [{
        icon: AppActionIcons.Add,
        action: () => { }
      }],
      searchIconEnabled: true,
      breadcrumbsEnabled: true,
      broadcastService: this.broadcastService
    };  
    // END - LIST MODEL

  constructor(
    public broadcastService: FilterListBroadcastService,
    private utility: UtilityService,
    private db: DatabaseService,
    private navigation: NavigationService,
    private entities: DatabaseEntitiesService
  ) {
    super();
  }

  ngOnInit(): void {
  }

  public onItemContentClick(filter: IFilterModel): void {
    this.entities.getCriteriaFromFilter(filter).then(criteria => {
      this.navigation.forward(AppRoute.Songs, { criteria: criteria });
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
}
