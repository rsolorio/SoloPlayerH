import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { AppEvent } from 'src/app/app-events';
import { EventsService } from 'src/app/core/services/events/events.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { SyncProfileEntity } from 'src/app/shared/entities';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class SyncProfileListBroadcastService extends ListBroadcastServiceBase<SyncProfileEntity> {

  constructor(
    private events: EventsService,
    private options: DatabaseOptionsService,
    private db: DatabaseService,
    private breadcrumbs: BreadcrumbsStateService)
  {
    super(events, options, breadcrumbs);
  }

  protected getEventName(): string {
    return AppEvent.SyncProfileListUpdated;
  }

  protected get isBreadcrumbSupported(): boolean {
    return false;
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

  protected getItems(criteria: Criteria): Observable<SyncProfileEntity[]> {
    return from(this.db.getList(SyncProfileEntity, criteria));
  }
}
