import { Injectable } from '@angular/core';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ArtistEntity } from 'src/app/shared/entities';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListListenerServiceBase } from 'src/app/shared/models/list-listener-service-base.class';

@Injectable({
  providedIn: 'root'
})
export class ArtistListStateService extends ListListenerServiceBase<ArtistEntity> {

  constructor(
    private utilityService: UtilityService,
    private eventService: EventsService,
    private navBarService: NavBarStateService)
  {
    super(eventService, navBarService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.ArtistListUpdated;
  }
}
