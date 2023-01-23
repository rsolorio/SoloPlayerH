import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AlbumViewEntity, AlbumClassificationViewEntity } from 'src/app/shared/entities';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class AlbumListBroadcastService extends ListBroadcastServiceBase<IAlbumModel> {

  constructor(
    private eventsService: EventsService,
    private utilityService: UtilityService,
    private db: DatabaseService)
  {
    super(eventsService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.AlbumListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const criteria: ICriteriaValueBaseModel[] = [];
    if (searchTerm) {
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      const criteriaValue = new CriteriaValueBase('name', criteriaSearchTerm, CriteriaOperator.Like);
      criteria.push(criteriaValue);
    }
    // TODO: sort by LastSongAddDate
    return criteria;
  }

  protected buildSystemCriteria(): ICriteriaValueBaseModel[] {
    return [new CriteriaValueBase('songCount', 0, CriteriaOperator.GreaterThan)];
  }

  protected addSortingCriteria(queryModel: QueryModel<IAlbumModel>): void {
    if (queryModel.hasCriteria('primaryArtistId') || queryModel.hasCriteria('artistId')) {
      queryModel.addSorting('releaseYear', CriteriaSortDirection.Ascending);
    }
    queryModel.addSorting('name', CriteriaSortDirection.Ascending);
  }

  protected getItems(queryModel: QueryModel<IAlbumModel>): Observable<IAlbumModel[]> {
    if (queryModel.hasCriteria('classificationId')) {
      return from(this.db.getList(AlbumClassificationViewEntity, queryModel));
    }
    return from(this.db.getList(AlbumViewEntity, queryModel));
  }
}
