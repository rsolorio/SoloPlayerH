import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ICriteriaResult } from '../services/criteria/criteria.interface';
import { ListStateServiceBase } from './list-state-service-base.class';

/**
 * Base service class that holds a state and listens for an event fired by a broadcast action
 * in order to update its state.
 */
export abstract class ListListenerServiceBase<TItemModel> extends ListStateServiceBase<TItemModel> {
  protected state: ICriteriaResult<TItemModel>;

  constructor(private events: EventsService, private navBar: NavBarStateService, private utilsService: UtilityService) {
      super(navBar, utilsService);
      this.subscribe();
  }

  // Protected Methods **************************************************************************

  /**
   * Subscribes to the event type retrieved from the getEventType method.
   * The response will replace the default state of the service.
   */
  protected subscribe(): void {
    const eventName = this.getEventName();
    if (eventName) {
      this.events.onEvent<ICriteriaResult<TItemModel>>(eventName).subscribe(response => {
        this.mergeResponse(response);
      });
    }
  }

  /**
   * Gets the event name that is going to be consumed.
   * This is an abstract method that has to be implemented in the sub class.
   */
  protected abstract getEventName(): string;
}
