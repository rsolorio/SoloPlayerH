import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ClassificationViewEntity } from 'src/app/shared/entities';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
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
    this.ignoredColumnsInCriteria.push('classificationType');
  }

  protected getEventName(): string {
    return AppEvent.ClassificationListUpdated;
  }

  protected buildCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const criteria: ICriteriaValueBaseModel[] = [];

    let criteriaValue = new CriteriaValueBase('classificationType', 'Genre');
    criteriaValue.Operator = this.isGenreList ? CriteriaOperator.Equals : CriteriaOperator.NotEquals;
    criteriaValue.SortDirection = CriteriaSortDirection.Ascending;
    criteriaValue.SortSequence = 1;
    criteria.push(criteriaValue);

    criteriaValue = new CriteriaValueBase('name');
    if (searchTerm) {
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      criteriaValue.ColumnValue = criteriaSearchTerm;
      criteriaValue.Operator = CriteriaOperator.Like;
    }
    criteriaValue.SortSequence = 2;
    criteriaValue.SortDirection = CriteriaSortDirection.Ascending;
    criteria.push(criteriaValue);

    return criteria;
  }

  protected getItems(listModel: IPaginationModel<IClassificationModel>): Observable<IClassificationModel[]> {
    return from(this.db.getList(ClassificationViewEntity, listModel.criteria));
  }
}
