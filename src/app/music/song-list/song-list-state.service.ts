import { Injectable } from '@angular/core';
import { AppEvent } from 'src/app/app-events';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ListListenerServiceBase } from 'src/app/shared/models/list-listener-service-base.class';
import { ISongModel } from 'src/app/shared/models/song-model.interface';

/** Service no currently used. */
@Injectable({
  providedIn: 'root'
})
export class SongListStateService extends ListListenerServiceBase<ISongModel> {

  constructor(
    private utilityService: UtilityService,
    private eventService: EventsService,
    private navbarService: NavBarStateService)
  {
    super(eventService, navbarService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.SongListUpdated;
  }
}
