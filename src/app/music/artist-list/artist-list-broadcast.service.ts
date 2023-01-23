import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AlbumArtistViewEntity, ArtistClassificationViewEntity, ArtistViewEntity } from 'src/app/shared/entities';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class ArtistListBroadcastService extends ListBroadcastServiceBase<IArtistModel> {

  public isAlbumArtist = false;
  constructor(
    private eventsService: EventsService,
    private utilityService: UtilityService,
    private db: DatabaseService)
  {
    super(eventsService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.ArtistListUpdated;
  }

  protected buildSearchCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    const criteria: ICriteriaValueBaseModel[] = [];
    if (searchTerm) {
      const criteriaSearchTerm = this.normalizeCriteriaSearchTerm(searchTerm, true);
      const criteriaValue = new CriteriaValueBase('name', criteriaSearchTerm, CriteriaOperator.Like);
      criteria.push(criteriaValue);
    }
    return criteria;
  }

  protected buildSystemCriteria(): ICriteriaValueBaseModel[] {
    return [new CriteriaValueBase('songCount', 0, CriteriaOperator.GreaterThan)];
  }

  protected addSortingCriteria(queryModel: QueryModel<IArtistModel>): void {
    queryModel.addSorting('name', CriteriaSortDirection.Ascending);
  }

  protected getItems(queryModel: QueryModel<IArtistModel>): Observable<IArtistModel[]> {
    if (this.isAlbumArtist) {
      if (queryModel.hasCriteria('classificationId')) {
        return from(this.db.getList(ArtistClassificationViewEntity, queryModel));
      }
      return from(this.db.getList(AlbumArtistViewEntity, queryModel));
    }
    return from(this.db.getList(ArtistViewEntity, queryModel));
  }
}
