import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlaylistViewEntity } from 'src/app/shared/entities';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class PlaylistListBroadcastService extends ListBroadcastServiceBase<IPlaylistModel> {

  constructor(
    private eventsService: EventsService,
    private utilityService: UtilityService,
    private db: DatabaseService)
  {
    super(eventsService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.PlaylistListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const criteria: ICriteriaValueBaseModel[] = [];
    if (searchTerm) {
      const criteriaValue = new CriteriaValueBase('name');
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      criteriaValue.ColumnValues.push(criteriaSearchTerm);
      criteriaValue.Operator = CriteriaOperator.Like;
      criteria.push(criteriaValue);
    }
    return criteria;
  }

  protected addSortingCriteria(queryModel: QueryModel<IPlaylistModel>): void {
    queryModel.addSorting('name', CriteriaSortDirection.Ascending);
  }

  protected getItems(queryModel: QueryModel<IPlaylistModel>): Observable<IPlaylistModel[]> {
    return from(this.db.getList(PlaylistViewEntity, queryModel));
  }
}
