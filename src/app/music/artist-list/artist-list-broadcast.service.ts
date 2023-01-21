import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AlbumArtistViewEntity, ArtistClassificationViewEntity, ArtistViewEntity } from 'src/app/shared/entities';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
import { CriteriaOperator, CriteriaSortDirection, ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { addSorting, CriteriaValueBase, hasCriteria, hasSorting } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IQueryModel } from 'src/app/shared/models/pagination-model.interface';
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
    this.ignoredColumnsInCriteria.push('songCount');
  }

  protected getEventName(): string {
    return AppEvent.ArtistListUpdated;
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

    return criteria;
  }

  protected addDefaultSorting(criteria: ICriteriaValueBaseModel[]): void {
    if (!hasSorting(criteria)) {
      addSorting('name', CriteriaSortDirection.Ascending, criteria);
    }
  }

  protected getItems(queryModel: IQueryModel<IArtistModel>): Observable<IArtistModel[]> {
    this.addDefaultSorting(queryModel.filterCriteria);
    if (this.isAlbumArtist) {
      if (hasCriteria('classificationId', queryModel.filterCriteria)) {
        return from(this.db.getList(ArtistClassificationViewEntity, queryModel));
      }
      return from(this.db.getList(AlbumArtistViewEntity, queryModel));
    }
    return from(this.db.getList(ArtistViewEntity, queryModel));
  }
}
