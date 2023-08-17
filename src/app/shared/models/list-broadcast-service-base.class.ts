import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EventsService } from 'src/app/core/services/events/events.service';
import { SearchWildcard } from './search.enum';
import { IDbModel } from './base-model.interface';
import { ICriteriaResult } from '../services/criteria/criteria.interface';
import { Criteria, CriteriaItems } from '../services/criteria/criteria.class';
import { BreadcrumbsStateService } from '../components/breadcrumbs/breadcrumbs-state.service';
import { DatabaseOptionsService } from '../services/database/database-options.service';
import { ModuleOptionName } from './module-option.enum';

export interface IListBroadcastService {
  search(criteria: Criteria, searchTerm?: string): Observable<ICriteriaResult<any>>;
  send(criteria: Criteria, suspendBroadcast?: boolean): Observable<ICriteriaResult<any>>;
}

/**
 * Base service class for cross component communication that broadcasts the result of its actions;
 * these actions include search and get.
 * The first time you call this service, the pageNumber must be set to 1.
 */
export abstract class ListBroadcastServiceBase<TItemModel extends IDbModel>
implements IListBroadcastService {

  protected minSearchTermLength = 2;

  protected get isBreadcrumbSupported(): boolean {
    return true;
  }

  constructor(
    private eventsService: EventsService,
    private optionService: DatabaseOptionsService,
    private breadcrumbService: BreadcrumbsStateService) { }

  /**
   * Uses the criteria to retrieve items from the server in order to send them through a broadcast event.
   */
  public send(criteria: Criteria, suspendBroadcast?: boolean): Observable<ICriteriaResult<TItemModel>> {
    this.beforeGetItems(criteria);
    return this.innerGetItems(criteria).pipe(
      map(response => {
        const result: ICriteriaResult<TItemModel> = {
          criteria: criteria,
          items: response
        };
        if (!suspendBroadcast && this.beforeBroadcast(result)) {
          this.innerBroadcast(result);
        }
        return result;
      })
    );
  }

  /** Performs a search based on the specified term and broadcasts an event with the result. */
  public search(criteria: Criteria, searchTerm?: string): Observable<ICriteriaResult<TItemModel>> {
    // Completely override any previous search
    criteria.searchCriteria = this.buildSearchCriteria(searchTerm);
    return this.send(criteria);
  }

  /**
   * Utility method that runs before calling the getItems method.
   * By default it sets the breadcrumb criteria value from the breadcrumb service.
   * It can be overridden in order to update the criteria object before getting the items.
   */
  protected beforeGetItems(criteria: Criteria): void {
    if (!this.isBreadcrumbSupported) {
      this.breadcrumbService.clear();
    }
    // This service will honor what the breadcrumb service has as criteria
    criteria.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();

    // Set the default only if it hasn't been specified
    if (!criteria.paging.pageSize) {
      const limit = this.optionService.getNumber(ModuleOptionName.ListViewLimit);
      if (limit) {
        criteria.paging.pageSize = limit;
      }
    }
  }

  /**
   * Utility method that runs before broadcasting the result items.
   * It can be overridden in order to implement logic before broadcasting;
   * returning FALSE will prevent the broadcast from happening.
   * @param items The list of items to be broadcasted.
   * @returns true by default.
   */
  protected beforeBroadcast(criteriaResult: ICriteriaResult<TItemModel>): boolean {
    return true;
  }

  /**
   * Sends the criteria result object through the event broadcast mechanism.
   */
  protected innerBroadcast(criteriaResult: ICriteriaResult<TItemModel>): void {
    this.eventsService.broadcast(this.getEventName(), criteriaResult);
  }

  /** Validates the minimum length of the search term. */
  protected isSearchTermValid(searchTerm: string): boolean {
    if (searchTerm) {
      if (searchTerm.length >= this.minSearchTermLength) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds starting and ending percentage wildcard to the search term if needed.
   */
  protected normalizeCriteriaSearchTerm(searchTerm: string, addWildcards?: boolean): string {
    searchTerm = searchTerm.trim();
    if (searchTerm === SearchWildcard.All) {
      return SearchWildcard.Any;
    }
    let criteriaSearchTerm = searchTerm;
    if (addWildcards && !searchTerm.startsWith(SearchWildcard.Any) && !searchTerm.endsWith(SearchWildcard.Any)) {
      criteriaSearchTerm = SearchWildcard.Any + searchTerm + SearchWildcard.Any;
    }
    return criteriaSearchTerm;
  }

  /**
  * Builds the criteria based on the specified search term.
  * @param searchTerm The search term.
  */
  protected abstract buildSearchCriteria(searchTerm: string): CriteriaItems;

  /** Any read only criteria needed for this entity. */
  protected buildSystemCriteria(): CriteriaItems {
    return new CriteriaItems();
  }

  protected addSortingCriteria(criteria: Criteria) {
  }

  /**
   * Gets the event name that is going to be broadcasted.
   * This is an abstract method that has to be implemented in the sub class.
   */
  protected abstract getEventName(): string;

  /**
   * Retrieves the items to be broadcasted.
   * This is an abstract method that has to be implemented in the sub class.
   */
  protected abstract getItems(criteria: Criteria): Observable<TItemModel[]>;

  private innerGetItems(criteria: Criteria): Observable<TItemModel[]> {
    // Always override any existing system criteria
    criteria.systemCriteria = this.buildSystemCriteria();
    if (!criteria.hasSorting()) {
      this.addSortingCriteria(criteria);
    }
    return this.getItems(criteria);
  }
}
