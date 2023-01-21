import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { ICriteriaValueBaseModel } from './criteria-base-model.interface';
import { CriteriaBase, CriteriaValueBase, hasAnyCriteria } from './criteria-base.class';
import { IPaginationModel } from './pagination-model.interface';
import { SearchWildcard } from './search.enum';
import { IDbModel } from './base-model.interface';
import { AppEvent } from './events.enum';

export interface IListBroadcastService {
  search(searchTerm?: string, extraCriteria?: ICriteriaValueBaseModel[]): Observable<any[]>;
  searchFavorites(): Observable<any[]>;
  getAndBroadcast(listModel: IPaginationModel<any>): Observable<any[]>;
}

/**
 * Base service class for cross component communication that broadcasts the result of its actions;
 * these actions include search and get.
 * The first time you call this service, the pageNumber must be set to 1.
 */
export abstract class ListBroadcastServiceBase<TItemModel extends IDbModel>
implements IListBroadcastService {

  protected lastResult: IPaginationModel<TItemModel>;
  protected minSearchTermLength = 2;
  /**
   * The list of columns to be ignored when the service determines if
   * criteria has been applied when retrieving the list of items.
   */
  protected ignoredColumnsInCriteria: string[] = [];

  constructor(private events: EventsService, private utilities: UtilityService) { }

  /**
   * Uses the criteria to build a default pagination object which will retrieve all items from
   * the server and the result will be eventually broadcasted.
   * @param criteria Criteria used to get the items from the server.
   */
  public paginateAndBroadcast(criteria: ICriteriaValueBaseModel[], name?: string): Observable<TItemModel[]> {
    const pagination: IPaginationModel<TItemModel> = {
      items: [],
      criteria,
      name
    };
    return this.getAndBroadcast(pagination);
  }

  /**
   * Uses the criteria to retrieve items from the server in order to send them through a broadcast event.
   */
  public getAndBroadcast(listModel: IPaginationModel<TItemModel>): Observable<TItemModel[]> {
    if (listModel.noMoreItems) {
      this.broadcast(listModel);
      return of(listModel.items);
    }
    return this.getItems(listModel).pipe(
      tap(response => {
        listModel.items = response;
        this.lastResult = listModel;

        if (this.beforeBroadcast(response)) {
          this.broadcast(listModel);
        }
      })
    );
  }

  public paginateAndRedirect(criteria: ICriteriaValueBaseModel[], route: AppRoutes, name?: string): Observable<TItemModel[]> {
    const pagination: IPaginationModel<TItemModel> = {
      items: [],
      criteria,
      name
    };
    return this.getAndRedirect(pagination, route);
  }

  /**
   * Gets the items from the server and redirects to the specified route.
   * Instead of sending data through a broadcast, this method sends data through parameters picked up
   * by a route resolver.
   * @param listModel The pagination information.
   * @param route The route to redirect to.
   */
  public getAndRedirect(listModel: IPaginationModel<TItemModel>, route: AppRoutes): Observable<TItemModel[]> {
    if (listModel.noMoreItems) {
      this.broadcast(listModel);
      return of(listModel.items);
    }
    return this.getItems(listModel).pipe(
      tap(response => {
        this.mergeResponseAndResult(response, listModel);
        this.lastResult = listModel;
        this.redirect(listModel, route);
      })
    );
  }

  /**
   * Redirects the specified pagination info to the specified route; it assumes the pagination already contains
   * the list of items to be displayed after the redirect occurs.
   * @param listModel The pagination information.
   * @param route The route to redirect to.
   */
  public redirect(listModel: IPaginationModel<TItemModel>, route: AppRoutes): void {
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
    return this.paginateAndBroadcast(searchCriteria);
  }

  public searchFavorites(): Observable<TItemModel[]> {
    const criteria: ICriteriaValueBaseModel[] = [];
    const criteriaValue = new CriteriaValueBase('Favorite', 'True');
    criteria.push(criteriaValue);
    return this.paginateAndBroadcast(criteria);
  }

  /**
   * Loads existing items into the list component by firing the specified event.
   * For some reason, updating the state (which is linked to the component) from another component does not trigger the change detection;
   * we are instead broadcasting the update to the component, which is subscribed to the event and then updates the list there.
   */
  public broadcast(listModel: IPaginationModel<TItemModel>): void {
    this.lastResult = listModel;
    this.events.broadcast(this.getEventName(), listModel);
    if (hasAnyCriteria(listModel.criteria, this.ignoredColumnsInCriteria)) {
      this.events.broadcast(AppEvent.CriteriaApplied, this.getEventName());
    }
    else {
      this.events.broadcast(AppEvent.CriteriaCleared, this.getEventName());
    }
  }

  /** Returns the last broadcasted data.
   * This is a hack since this should be retrieved from the appropriate listener service.
   */
  public getLast(): IPaginationModel<TItemModel> {
    return this.lastResult;
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

   protected getCriteriaBase(listModel: IPaginationModel<TItemModel>): CriteriaBase {
     const pageNumber = listModel.pageNumber ? listModel.pageNumber : 1;
     let pageSize = 0;
     if (listModel.totalSize) {
       if (listModel.pageSize) {
        const itemCount = listModel.pageSize * (pageNumber - 1);
        if (itemCount >= listModel.totalSize) {
          // TODO: although this is true, this listModel object is not the one being returned,
          // this method returns a CriteriaBase so the dev will not now that they need to look up for this value
          listModel.noMoreItems = true;
        }
       }
       else {
        pageSize = listModel.totalSize;
       }
     }
     else if (listModel.pageSize) {
       pageSize = listModel.pageSize;
     }
     return new CriteriaBase(pageSize, pageNumber);
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
