import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { IStateService } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IPaginationModel } from './pagination-model.interface';

/**
 * Base service class that holds and exposes a state.
 */
export abstract class ListStateServiceBase<TItemModel> implements IStateService<IPaginationModel<TItemModel>> {
  protected state: IPaginationModel<TItemModel>;

  constructor(private navbar: NavBarStateService, private utilities: UtilityService) {}

  // Public Methods *****************************************************************************

  /**
   * Returns the state object of the service.
   */
  public getState(): IPaginationModel<TItemModel> {
    if (!this.state) {
      this.state = this.buildInitialState();
    }
    return this.state;
  }

  public mergeResponse(response: IPaginationModel<TItemModel>): void {
    if (response && response.items) {
      const state = this.getState();
      state.items = response.items;
      state.name = response.name;
      state.criteria = response.criteria;
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
  protected buildInitialState(): IPaginationModel<TItemModel> {
    return {
      items: [],
      pageNumber: 0,
      pageSize: 0,
      totalSize: 0,
      loadingItems: false,
      noMoreItems: false
    };
  }

  protected afterStateMerge(state: IPaginationModel<TItemModel>): void {
    this.navbar.showToast(`Found: ${state.items.length} item` + (state.items.length !== 1 ? 's' : ''));
  }

  protected getScrollContainerId(): string {
    return null;
  }
}
