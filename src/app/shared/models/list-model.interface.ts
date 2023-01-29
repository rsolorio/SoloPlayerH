export interface IListModel<T> {
    /** List of items. */
    items: T[];
    /** Unique identifier of this model. */
    id?: string;
    /** A descriptive name that represents the list of items. */
    name?: string;
}
