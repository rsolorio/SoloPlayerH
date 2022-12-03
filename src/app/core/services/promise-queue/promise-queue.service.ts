import { Injectable } from '@angular/core';
import { IPromiseItem, IPromiseQueue } from './promise-queue.interface';

@Injectable({
  providedIn: 'root'
})
export class PromiseQueueService {

  private queue: IPromiseQueue = {
    promises: []
  };

  constructor() { }

  public set sink(promiseItem: IPromiseItem<any>) {
    this.push(promiseItem.promise, promiseItem.callback);
  }

  public push<T>(promise: Promise<T>, callback?: (response: T) => void): void {
    this.queue.promises.push({
      promise,
      callback
    })

    // If this is the only promise just run it
    if (this.queue.promises.length === 1) {
      this.runNextPromise();
    }
  }

  private runNextPromise(): void {
    // Make sure there's something to run
    if (!this.queue.promises.length) {
      return;
    }
    const item = this.queue.promises.shift();
    item.promise.then(response => {
      if (item.callback) {
        item.callback(response);
      }
      // Once it is done, go to the next promise
      this.runNextPromise();
    });
  }
}
