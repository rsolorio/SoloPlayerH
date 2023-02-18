import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { IStateService } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { Criteria } from '../services/criteria/criteria.class';
import { ICriteriaResult } from '../services/criteria/criteria.interface';

export interface IListStateService {
  getState(): ICriteriaResult<any>;
}

/**
 * Base service class that holds and exposes a state.
 */
export abstract class ListStateServiceBase<TItemModel> implements IStateService<ICriteriaResult<TItemModel>>, IListStateService {
  protected state: ICriteriaResult<TItemModel>;

  constructor(private navbar: NavBarStateService, private utilities: UtilityService) {}

  // Public Methods *****************************************************************************

  /**
   * Returns the state object of the service.
   */
  public getState(): ICriteriaResult<TItemModel> {
    if (!this.state) {
      this.state = this.buildInitialState();
    }
    return this.state;
  }

  public mergeResponse(response: ICriteriaResult<TItemModel>): void {
    if (response && response.items) {
      const state = this.getState();
      state.items = response.items;
      state.name = response.name;
      state.criteria = response.criteria;
      this.afterStateMerge(state);
      this.utilities.scrollToTop(this.getScrollContainerId());
    }
  }

  // Protected Methods **************************************************************************

  /**
   * Creates the default state of the service, which can be overwritten if there's an event to subscribe to.
   */
  protected buildInitialState(): ICriteriaResult<TItemModel> {
    return {
      criteria: new Criteria('Search Results'),
      items: []
    };
  }

  protected afterStateMerge(state: ICriteriaResult<TItemModel>): void {
    this.navbar.showToast(`Found: ${state.items.length} item` + (state.items.length !== 1 ? 's' : ''));
  }

  protected getScrollContainerId(): string {
    return null;
  }
}
