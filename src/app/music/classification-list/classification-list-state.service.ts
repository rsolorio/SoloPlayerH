import { Injectable } from '@angular/core';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListListenerServiceBase } from 'src/app/shared/models/list-listener-service-base.class';

/** Service no currently used. */
@Injectable({
  providedIn: 'root'
})
export class ClassificationListStateService extends ListListenerServiceBase<IClassificationModel> {

  constructor(
    private utilityService: UtilityService,
    private eventService: EventsService,
    private navbarService: NavBarStateService)
  {
    super(eventService, navbarService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.ClassificationListUpdated;
  }
}
