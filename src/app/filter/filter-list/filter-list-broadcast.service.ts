import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { FilterEntity } from 'src/app/shared/entities/filter.entity';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IFilterModel } from 'src/app/shared/models/filter-model.interface';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class FilterListBroadcastService extends ListBroadcastServiceBase<IFilterModel> {

  constructor(
    private events: EventsService,
    private utilities: UtilityService,
    private db: DatabaseService,
    private breadcrumbs: BreadcrumbsStateService)
  {
    super(events, utilities, breadcrumbs);
  }

  protected getEventName(): string {
    return AppEvent.FilterListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): CriteriaItems {
    const result = new CriteriaItems();
    if (searchTerm) {
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      const criteriaItem = new CriteriaItem('name', criteriaSearchTerm, CriteriaComparison.Like);
      result.push(criteriaItem);
    }
    return result;
  }

  protected getItems(criteria: Criteria): Observable<IFilterModel[]> {
    return from(this.db.getList(FilterEntity, criteria));
  }
}
