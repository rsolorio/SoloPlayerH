import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { ICriteriaValueBaseModel } from './criteria-base-model.interface';
import { hasAnyCriteria } from './criteria-base.class';
import { IPaginationModel } from './pagination-model.interface';
import { SearchWildcard } from './search.enum';
import { IDbModel } from './base-model.interface';
import { AppEvent } from './events.enum';

export interface IListBroadcastService {
  search(searchTerm?: string, extraCriteria?: ICriteriaValueBaseModel[]): Observable<any[]>;
  send(listModel: IPaginationModel<any>): Observable<any[]>;
}

/**
 * Base service class for cross component communication that broadcasts the result of its actions;
 * these actions include search and get.
 * The first time you call this service, the pageNumber must be set to 1.
 */
export abstract class ListBroadcastServiceBase<TItemModel extends IDbModel>
implements IListBroadcastService {

  protected minSearchTermLength = 2;
  /**
   * The list of columns to be ignored when the service determines if
   * criteria has been applied when retrieving the list of items.
   */
  protected ignoredColumnsInCriteria: string[] = [];

  constructor(private events: EventsService, private utilities: UtilityService) { }

  /**
   * Uses the criteria to retrieve items from the server in order to send them through a broadcast event.
   */
  public send(listModel: IPaginationModel<TItemModel>): Observable<TItemModel[]> {
    if (listModel.noMoreItems) {
      this.innerBroadcast(listModel);
      return of(listModel.items);
    }
    return this.getItems(listModel).pipe(
      tap(response => {
        listModel.items = response;
        if (this.beforeBroadcast(response)) {
          this.innerBroadcast(listModel);
        }
      })
    );
  }

  /**
   * Gets the items from the server and redirects to the specified route.
   * Instead of sending data through a broadcast, this method sends data through parameters picked up
   * by a route resolver.
   * @param listModel The pagination information.
   * @param route The route to redirect to.
   */
  public redirect(listModel: IPaginationModel<TItemModel>, route: AppRoutes): Observable<TItemModel[]> {
    if (listModel.noMoreItems || !listModel.items.length) {
      this.innerRedirect(listModel, route);
      return of(listModel.items);
    }
    return this.getItems(listModel).pipe(
      tap(response => {
        this.mergeResponseAndResult(response, listModel);
        this.innerRedirect(listModel, route);
      })
    );
  }

  /**
   * Redirects the specified pagination info to the specified route; it assumes the pagination already contains
   * the list of items to be displayed after the redirect occurs.
   * @param listModel The pagination information.
   * @param route The route to redirect to.
   */
  protected innerRedirect(listModel: IPaginationModel<TItemModel>, route: AppRoutes): void {
    this.utilities.navigateWithComplexParams(route, listModel);
  }

  /** Performs a search based on the specified term and broadcasts an event with the result. */
  public search(searchTerm?: string, extraCriteria?: ICriteriaValueBaseModel[]): Observable<TItemModel[]> {
    const searchCriteria = this.buildCriteria(searchTerm);
    // TODO: better logic to ensure columns are not duplicated
    if (hasAnyCriteria(extraCriteria)) {
      for (const extraCriteriaItem of extraCriteria) {
        searchCriteria.push(extraCriteriaItem);
      }
    }

    const pagination: IPaginationModel<TItemModel> = {
      items: [],
      criteria: searchCriteria
    };
    return this.send(pagination);
  }

  /**
   * Sends the listModel object through the event broadcast mechanism.
   */
  protected innerBroadcast(listModel: IPaginationModel<TItemModel>): void {
    this.events.broadcast(this.getEventName(), listModel);
    if (hasAnyCriteria(listModel.criteria, this.ignoredColumnsInCriteria)) {
      this.events.broadcast(AppEvent.CriteriaApplied, this.getEventName());
    }
    else {
      this.events.broadcast(AppEvent.CriteriaCleared, this.getEventName());
    }
  }

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

  protected mergeResponseAndResult(response: TItemModel[], result: IPaginationModel<TItemModel>): void {
    result.items = response;

    if (!result.pageSize) {
      result.pageSize = response.length;
    }

    if (!result.pageNumber) {
      result.pageNumber = 1;
    }

    if (!result.noMoreItems && (response.length < result.pageSize || response.length === 0)) {
      result.noMoreItems = true;
    }

    if (!result.noMoreItems && result.totalSize) {
      // TODO: calculate number of items to determine if we need more items.
    }
   }

   /**
    * Builds the criteria based on the specified search term.
    * @param searchTerm The search term.
    */
  protected abstract buildCriteria(searchTerm: string): ICriteriaValueBaseModel[];

  /**
   * Utility method that runs before broadcasting the result items.
   * It can be overridden in order to implement logic before broadcasting;
   * returning FALSE will prevent the broadcast from happening.
   * @param items The list of items to be broadcasted.
   * @returns true by default.
   */
  protected beforeBroadcast(items: TItemModel[]): boolean {
    return true;
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
  protected abstract getItems(listModel: IPaginationModel<TItemModel>): Observable<TItemModel[]>;
}
