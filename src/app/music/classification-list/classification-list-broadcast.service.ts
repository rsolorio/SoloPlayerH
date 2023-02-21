import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ClassificationViewEntity } from 'src/app/shared/entities';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class ClassificationListBroadcastService extends ListBroadcastServiceBase<IClassificationModel> {

  public isGenreList = false;
  constructor(
    private events: EventsService,
    private utilities: UtilityService,
    private db: DatabaseService,
    private breadcrumbs: BreadcrumbsStateService)
  {
    super(events, utilities, breadcrumbs);
  }

  protected getEventName(): string {
    return AppEvent.ClassificationListUpdated;
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

  protected buildSystemCriteria(): CriteriaItems {
    const criteriaItem = new CriteriaItem('classificationType', 'Genre');
    criteriaItem.comparison = this.isGenreList ? CriteriaComparison.Equals : CriteriaComparison.NotEquals;
    return new CriteriaItems(criteriaItem);
  }

  protected addSortingCriteria(criteria: Criteria) {
    criteria.addSorting('classificationType');
    criteria.addSorting('name');
  }

  protected beforeGetItems(criteria: Criteria): void {
    this.removeUnsupportedBreadcrumbs();
    super.beforeGetItems(criteria);
  }

  private removeUnsupportedBreadcrumbs(): void {
    // Classifications/genres do not support any kind of breadcrumbs
    this.breadcrumbs.clear();
  }

  protected getItems(criteria: Criteria): Observable<IClassificationModel[]> {
    return from(this.db.getList(ClassificationViewEntity, criteria));
  }
}
