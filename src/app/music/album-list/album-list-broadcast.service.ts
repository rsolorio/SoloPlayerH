import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AlbumViewEntity, AlbumClassificationViewEntity } from 'src/app/shared/entities';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { addSorting, CriteriaValueBase, hasCriteria, hasSorting } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IQueryModel } from 'src/app/shared/models/pagination-model.interface';
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
    this.ignoredColumnsInCriteria.push('songCount');
  }

  protected getEventName(): string {
    return AppEvent.AlbumListUpdated;
  }

  protected buildCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const criteria: ICriteriaValueBaseModel[] = [];
    let criteriaValue: ICriteriaValueBaseModel;

    if (searchTerm) {
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      criteriaValue = new CriteriaValueBase('name', criteriaSearchTerm, CriteriaOperator.Like);
      criteria.push(criteriaValue);
    }

    criteriaValue = new CriteriaValueBase('songCount', 0, CriteriaOperator.GreaterThan);
    criteria.push(criteriaValue);

    // TODO: sort by LastSongAddDate
    return criteria;
  }

  protected addDefaultSorting(criteria: ICriteriaValueBaseModel[]): void {
    if (!hasSorting(criteria)) {
      if (hasCriteria('primaryArtistId', criteria) || hasCriteria('artistId', criteria)) {
        addSorting('releaseYear', CriteriaSortDirection.Ascending, criteria);
      }
      addSorting('name', CriteriaSortDirection.Ascending, criteria);
    }
  }

  protected getItems(queryModel: IQueryModel<IAlbumModel>): Observable<IAlbumModel[]> {
    this.addDefaultSorting(queryModel.filterCriteria);
    if (hasCriteria('classificationId', queryModel.filterCriteria)) {
      return from(this.db.getList(AlbumClassificationViewEntity, queryModel));
    }
    return from(this.db.getList(AlbumViewEntity, queryModel));
  }
}
