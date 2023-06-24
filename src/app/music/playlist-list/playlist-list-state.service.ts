import { Injectable } from '@angular/core';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { ListListenerServiceBase } from 'src/app/shared/models/list-listener-service-base.class';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';

/** Service no currently used. */
@Injectable({
  providedIn: 'root'
})
export class PlaylistListStateService extends ListListenerServiceBase<IPlaylistModel> {

  constructor(
    private utilityService: UtilityService,
    private eventService: EventsService,
    private navbarService: NavBarStateService)
  {
    super(eventService, navbarService, utilityService);
  }

  protected getEventName(): string {
    return AppEvent.PlaylistListUpdated;
  }
}
