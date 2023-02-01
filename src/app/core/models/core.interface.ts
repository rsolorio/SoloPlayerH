export interface IValueModel<T> {
  value?: T;
}

export interface IKeyValuePair<TKey, TValue> {
  key: TKey;
  value: TValue;
}

export interface ICollection<TKey, TValue> {
  items: IKeyValuePair<TKey, TValue>[];
}

/**
 * Event interface used for two purposes:
 * DOM events and Broadcast events.
 */
export interface IEventArgs<TValue> {
  oldValue: TValue;
  newValue: TValue;
  event?: Event;
}

export interface INumberRange {
  from: number;
  to: number;
}

export interface IDateRange {
  from: Date;
  to: Date;
}

export interface IMonthRange {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
}

/** Interface that provides a "selected" optional property. */
export interface ISelectable {
  selected?: boolean;
}

export interface ITimestampItem {
  id?: string;
  timestamp?: Date;
}

export interface ISelectedItem extends ITimestampItem, ISelectable {
  caption: string;
  icon?: string;
  data?: any;
}

export interface ISelectedDataItem<TData> extends ISelectedItem {
  data: TData;
}

export interface ISelectedItemTransform {
  selectedData: any;
  mapFn?: (item: any) => ISelectedItem;
}

export interface ISelectionDataItemTransform<TData> extends ISelectedItemTransform {
  selectedData: TData;
  mapFn?: <TItem>(item: TItem) => ISelectedDataItem<TData>;
}

export interface IStateService<T> {
  getState(): T;
}

export interface IPosition {
  top: number;
  left: number;
}

export interface ICoordinate {
  x: number;
  y: number;
}

export interface ISize {
  height: number;
  width: number;
}

export interface IArea extends ISize {
  start: ICoordinate;
  end: ICoordinate;
}

export interface IIconActionGeneric<TParam> {
  /** Icon css class. */
  icon?: string;
  /** Action to be fired by the icon. */
  action?(param?: TParam): void;
}

export interface IIconAction extends IIconActionGeneric<any> {
}
