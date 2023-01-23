import { ICriteriaValueBaseModel } from './criteria-base-model.interface';
import { IListModel } from './list-model.interface';

/**
 * Exposes a list of properties used to perform a search, hold the state of it and store the results.
 * It is a generic implementation that specifies the type of items to hold.
 */
export interface IQueryModel<T> extends IListModel<T> {
    /** Read only criteria needed by the system to properly retrieve the expected results. */
    systemCriteria?: ICriteriaValueBaseModel[];
    /** Criteria that comes from breadcrumbs. */
    breadcrumbCriteria?: ICriteriaValueBaseModel[];
    /** Any generic criteria to perform a search. */
    searchCriteria?: ICriteriaValueBaseModel[];
    /** Extra criteria specified by the user. */
    userCriteria?: ICriteriaValueBaseModel[];
    /** Criteria for specifying sorting to the final filter. */
    sortingCriteria?: ICriteriaValueBaseModel[];
    /** Any generic criteria to be applied to the filter.*/
    filterCriteria?: ICriteriaValueBaseModel[];
    /** The current page being displayed */
    pageNumber?: number;
    /** The number of items for each page. If this is not set or zero pagination will be disabled. */
    pageSize?: number;
    /** Flag that tells the scrolling mechanism we are loading items, so we don't try to do it multiple times */
    loadingItems?: boolean;
    /** Flag the tells the infinite scroll in the client there are no more items to load from the server. */
    noMoreItems?: boolean;
    /** The total number of items to return. */
    totalSize?: number;
    /** If select distinct should be used as part of the filter. */
    distinct?: boolean;
}