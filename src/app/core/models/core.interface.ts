import { ImageSrcType } from "./core.enum";

/** A generic key/value pair where the key is the indexed property. */
export type KeyValueGen<TKey> = { [key: string]: TKey };
/** A generic key/value pair where the key is the indexed property and the value is a list of items. */
export type KeyValuesGen<TKey> = { [key: string]: TKey[] };
/** A key/value pair where the key and the value are strings. */
export type KeyValue = KeyValueGen<string>;
/** A key/value pair where the key is the indexed property and the value is a list of items. */
export type KeyValues = KeyValuesGen<any>;

export interface IValueModel<T> {
  value?: T;
}

export interface IKeyValuePair<TKey, TValue> {
  key: TKey;
  value?: TValue;
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

export interface ITimeSpan {
  /** Total number of milliseconds of the time span. */
  total?: number;
  /** The milliseconds portion of the time span. */
  milliseconds?: number;
  /** The seconds portion of the time span. */
  seconds?: number;
  /** The minutes portion of the time span. */
  minutes?: number;
  /** The hours portion of the time span. */
  hours?: number;
  /** The days portion of the time span. */
  days?: number;
  /** Generic property to store related information especially for debugging purposes. */
  data?: any;
}

export interface ITimePeriod extends IDateRange {
  span: ITimeSpan;
  laps?: ITimeSpan[];
}

export interface IDateTimeText {
  year: string;
  month: string;
  day: string;
  hour: string;
  hour12: string;
  amPm: string;
  minute: string;
  second: string;
  millisecond: string;
}

export interface IDateTimeFormat {
  /** The symbol that separates the date values. */
  dateSeparator: string;
  /** The symbol that separates the date from the time values. If undefined, the time value will not be included. */
  dateTimeSeparator?: string;
  /** The symbol that separates the time values (hour/minute/second). */
  timeSeparator?: string;
  /** The symbol that separates the milliseconds from the rest of the time values. If undefined, milliseconds will not be included in the result. */
  millisecondSeparator?: string;
  /** The symbol that separates the am/pm values from the rest of the time values. If specified, the time will be formatted to 12-hours. If undefined, the time will be formatted to 24-hours. */
  amPmSeparator?: string;
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
  /** Unique identifier of the icon. */
  id?: string;
  /** Icon css class. */
  icon?: string;
  /** Extra css class. */
  styleClass?: string;
  /** Html element title. */
  tooltip?: string;
  /** Determines if the icon is in OFF state. */
  off?: boolean;
  /** Icon css class for the OFF state. */
  offIcon?: string;
  /** Extra css class for the OFF state. */
  offStyleClass?: string;
  /** Html element title for the OFF state. */
  offToolTip?: string;
  /** If the icon should be hidden. */
  hidden?: boolean;
  /** Css class that can be applied to the parent element. */
  parentStyleClass?: string;
}

export interface IIconActionGeneric<TIconAction, TParam> extends IIcon {
  /** Timeout in milliseconds before the action is performed. */
  actionTimeout?: number;
  /** Caption associated with the default action. */
  caption?: string;
  /** Caption associated with the off action. */
  offCaption?: string;
  /** Action to be fired by the icon. */
  action?(iconAction: TIconAction, param?: TParam): void;
  /** Action to be fired by the OFF icon. */
  offAction?(iconAction: TIconAction, param?: TParam): void;
}

export interface IIconAction extends IIconActionGeneric<IIconAction, any> {
}

export interface IProcessDuration<TResult> {
  period: ITimePeriod;
  result: TResult;
}