import { ImageSrcType } from "./core.enum";

export type KeyValuesGen<TKey> = { [key: string]: TKey[] };
export type KeyValues = KeyValuesGen<any>;

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

export interface IValuePair {
  value: any;
  caption?: string;
}

export interface ISelectableValue extends IValuePair, ISelectable {
  icon?: string;
  sequence?: number;
}

export interface IImage {
  /** The src attribute of the image. */
  src?: string;
  /** The src type of the image. */
  srcType?: ImageSrcType;
}

export interface IImageSource {
  sourceType: string;
  sourcePath: string;
  sourceIndex: number;
  mimeType: string;
  imageType: string;
}

export interface IRouteInfo {
  url: string;
  route: string;
  queryParams?: any;
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

export interface IIcon {
  /** Icon css class. */
  icon?: string;
  /** Extra css class. */
  styleClass?: string;
  /** Html element title. */
  tooltip?: string;
}

export interface IIconActionGeneric<TParam> extends IIcon {
  /** Timeout in milliseconds before the action is performed. */
  actionTimeout?: number;
  /** Action to be fired by the icon. */
  action?(param?: TParam): void;
}

export interface IIconAction extends IIconActionGeneric<any> {
}
