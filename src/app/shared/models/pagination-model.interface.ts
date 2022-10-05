import { ICriteriaValueBaseModel } from './criteria-base-model.interface';
import { IListModel } from './list-model.interface';

/**
 * Exposes a list of properties used to perform a search, hold the state of it and store the results.
 * It is a generic implementation that specifies the type of items to hold.
 */
export interface IPaginationModel<T> extends IListModel<T> {
    /** Criteria used to retrieved the list of items */
    criteria?: ICriteriaValueBaseModel[];
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
}
