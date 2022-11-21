import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlaylistViewEntity } from 'src/app/shared/entities';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
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

  protected supportsSearchAllWildcard(): boolean {
    return true;
  }

  protected buildCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
    const criteria: ICriteriaValueBaseModel[] = [];

    const criteriaValue = new CriteriaValueBase('name', criteriaSearchTerm, CriteriaOperator.Like);
    criteriaValue.SortDirection = CriteriaSortDirection.Ascending;
    criteriaValue.SortSequence = 1;
    criteria.push(criteriaValue);

    return criteria;
  }

  protected getItems(listModel: IPaginationModel<IPlaylistModel>): Observable<IPlaylistModel[]> {
    return from(this.db.getList(PlaylistViewEntity, listModel.criteria));
  }
}
