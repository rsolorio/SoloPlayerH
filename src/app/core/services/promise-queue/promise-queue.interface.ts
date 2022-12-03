export interface IPromiseItem<T> {
  promise: Promise<T>;
  callback?: (response: T) => void;
}

export interface IPromiseQueue {
  promises: IPromiseItem<any>[];
}