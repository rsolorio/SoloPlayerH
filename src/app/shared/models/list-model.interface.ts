export interface IListModel<T> {
    /** List of items. */
    items: T[];
    /** A descriptive name that represents the list of items. */
    name?: string;
}
