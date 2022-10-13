import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListBroadcastServiceBase } from 'src/app/shared/models/list-broadcast-service-base.class';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Injectable({
  providedIn: 'root'
})
export class ClassificationListBroadcastService extends ListBroadcastServiceBase<IClassificationModel> {

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

  protected buildCriteria(searchTerm: string): ICriteriaValueBaseModel[] {
    return null;
  }

  protected getItems(listModel: IPaginationModel<IClassificationModel>): Observable<IClassificationModel[]> {
    return from(this.db.getClassificationView());
  }

  public getAndBroadcastGenres(listModel: IPaginationModel<IClassificationModel>): Observable<IClassificationModel[]> {
    if (listModel.noMoreItems) {
      this.broadcast(listModel);
      return of(listModel.items);
    }
    return from(this.db.getGenreView()).pipe(
      tap(response => {
        listModel.items = response;
        this.lastResult = listModel;

        if (this.beforeBroadcast(response)) {
          this.broadcast(listModel);
        }
      })
    );
  }
}
