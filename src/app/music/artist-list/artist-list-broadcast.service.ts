import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ArtistEntity } from 'src/app/shared/entities';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class ArtistListBroadcastService extends ListBroadcastServiceBase<ArtistEntity> {

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

  protected buildCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    return null;
  }

  protected getItems(listModel: IPaginationModel<ArtistEntity>): Observable<ArtistEntity[]> {
    return from(this.db.getArtistsWithAlbums());
  }
}
