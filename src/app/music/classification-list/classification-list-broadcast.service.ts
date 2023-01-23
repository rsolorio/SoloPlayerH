import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ClassificationViewEntity } from 'src/app/shared/entities';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class ClassificationListBroadcastService extends ListBroadcastServiceBase<IClassificationModel> {

  public isGenreList = false;
  constructor(
    private eventsService: EventsService,
    private utilityService: UtilityService,
    private db: DatabaseService)
  {
    super(eventsService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.ClassificationListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const criteria: ICriteriaValueBaseModel[] = [];    
    if (searchTerm) {
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      const criteriaValue = new CriteriaValueBase('name', criteriaSearchTerm);
      criteriaValue.Operator = CriteriaOperator.Like;
      criteria.push(criteriaValue);
    }
    return criteria;
  }

  protected buildSystemCriteria(): ICriteriaValueBaseModel[] {
    const criteriaValue = new CriteriaValueBase('classificationType', 'Genre');
    criteriaValue.Operator = this.isGenreList ? CriteriaOperator.Equals : CriteriaOperator.NotEquals;
    return [criteriaValue];
  }

  protected addSortingCriteria(queryModel: QueryModel<IClassificationModel>) {
    queryModel.addSorting('classificationType', CriteriaSortDirection.Ascending);
    queryModel.addSorting('name', CriteriaSortDirection.Ascending);
  }

  protected getItems(queryModel: QueryModel<IClassificationModel>): Observable<IClassificationModel[]> {
    return from(this.db.getList(ClassificationViewEntity, queryModel));
  }
}
