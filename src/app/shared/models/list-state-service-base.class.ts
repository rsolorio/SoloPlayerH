import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { IStateService } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { QueryModel } from './query-model.class';

export interface IListStateService {
  getState(): QueryModel<any>;
}

/**
 * Base service class that holds and exposes a state.
 */
export abstract class ListStateServiceBase<TItemModel> implements IStateService<QueryModel<TItemModel>>, IListStateService {
  protected state: QueryModel<TItemModel>;

  constructor(private navbar: NavBarStateService, private utilities: UtilityService) {}

  // Public Methods *****************************************************************************

  /**
   * Returns the state object of the service.
   */
  public getState(): QueryModel<TItemModel> {
    if (!this.state) {
      this.state = this.buildInitialState();
    }
    return this.state;
  }

  public mergeResponse(response: QueryModel<TItemModel>): void {
    if (response && response.items) {
      const state = this.getState();
      state.items = response.items;
      state.name = response.name;
      state.systemCriteria = response.systemCriteria;
      state.breadcrumbCriteria = response.breadcrumbCriteria;
      state.searchCriteria = response.searchCriteria;
      state.userCriteria = response.userCriteria;
      state.sortingCriteria = response.sortingCriteria;
      state.pageNumber = response.pageNumber;
      state.pageSize = response.pageSize;
      state.totalSize = response.totalSize;
      state.loadingItems = response.loadingItems;
      state.noMoreItems = response.noMoreItems;
      this.afterStateMerge(state);
      this.utilities.scrollToTop(this.getScrollContainerId());
    }
  }

  // Protected Methods **************************************************************************

  /**
   * Creates the default state of the service, which can be overwritten if there's an event to subscribe to.
   */
  protected buildInitialState(): QueryModel<TItemModel> {
    return new QueryModel<TItemModel>();
  }

  protected afterStateMerge(state: QueryModel<TItemModel>): void {
    this.navbar.showToast(`Found: ${state.items.length} item` + (state.items.length !== 1 ? 's' : ''));
  }

  protected getScrollContainerId(): string {
    return null;
  }
}
