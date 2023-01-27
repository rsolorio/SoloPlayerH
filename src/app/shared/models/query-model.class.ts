import { CriteriaSortDirection, ICriteriaValueBaseModel } from "./criteria-base-model.interface";
import { addSorting, hasAnyCriteria, hasCriteria, hasSorting } from "./criteria-base.class";
import { IListModel } from './list-model.interface';

/**
 * Exposes a list of properties used to perform a search, hold the state of it and store the results.
 * It is a generic implementation that specifies the type of items to hold.
 */
export class QueryModel<T> implements IListModel<T> {
  /** Read only criteria needed by the system to properly retrieve the expected results. */
  public systemCriteria: ICriteriaValueBaseModel[];
  /** Criteria that comes from breadcrumbs. */
  public breadcrumbCriteria: ICriteriaValueBaseModel[];
  /** Any generic criteria to perform a search. */
  public searchCriteria: ICriteriaValueBaseModel[];
  /** Extra criteria specified by the user. */
  public userCriteria: ICriteriaValueBaseModel[];
  /** Criteria for specifying sorting to the final filter. */
  public sortingCriteria: ICriteriaValueBaseModel[];
  /** If the results are paged, this value represents the page that will be loaded. */
  public pageNumber: number;
  /** The number of items for each page. If this is not set or zero pagination will be disabled. */
  public pageSize: number;
  /** Flag that tells the scrolling mechanism we are loading items, so we don't try to do it multiple times. */
  public loadingItems: boolean;
  /** Flag the tells the infinite scroll in the client there are no more items to load from the source. */
  public noMoreItems: boolean;
  /** The total number of items to return. */
  public totalSize: number;
  /** If select distinct should be used as part of the filter. */
  public distinct: boolean;
  /** The result of the query. */
  public items: T[];
  /** A human readable name for this query. */
  public name: string;
  /** Date on which this query was created. */
  public date: Date;
  /** Algorithm to perform a special sort in the list of items.  */
  public sortingAlgorithm: string;

  constructor() {
    this.items = [];
    this.pageNumber = 0;
    this.pageSize = 0;
    this.loadingItems = false;
    this.noMoreItems = false;
    this.totalSize = 0;
    this.distinct = false;
    this.systemCriteria = [];
    this.breadcrumbCriteria = [];
    this.searchCriteria = [];
    this.userCriteria = [];
    this.sortingCriteria = [];
  }

  public getAllCriteria(): ICriteriaValueBaseModel[] {
    let allCriteria: ICriteriaValueBaseModel[] = [];
    if (this.systemCriteria) {
      allCriteria = allCriteria.concat(this.systemCriteria);
    }
    if (this.breadcrumbCriteria) {
      allCriteria = allCriteria.concat(this.breadcrumbCriteria);
    }
    if (this.searchCriteria) {
      allCriteria = allCriteria.concat(this.searchCriteria);
    }
    if (this.userCriteria) {
      allCriteria = allCriteria.concat(this.userCriteria);
    }
    if (this.sortingCriteria) {
      allCriteria = allCriteria.concat(this.sortingCriteria);
    }
    // TODO: combine all sorting criteria and fix sequence
    return allCriteria;
  }

  public hasCriteria(columnName: string): boolean {
    return hasCriteria(columnName, this.systemCriteria) ||
      hasCriteria(columnName, this.breadcrumbCriteria) ||
      hasCriteria(columnName, this.searchCriteria) ||
      hasCriteria(columnName, this.userCriteria);
  }

  /** Determines if the query has any criteria, ignoring system and sorting criteria. */
  public hasAnyCriteria(): boolean {
    return hasAnyCriteria(this.breadcrumbCriteria) ||
      hasAnyCriteria(this.searchCriteria) ||
      hasAnyCriteria(this.userCriteria);
  }

  public hasSorting(): boolean {
    return hasSorting(this.sortingCriteria);
  }

  public addSorting(columnName: string, sortDirection: CriteriaSortDirection): void {
    addSorting(columnName, sortDirection, this.sortingCriteria);
  }
}