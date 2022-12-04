import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PromiseQueueService {
  private queue: Promise<any>[] = [];
  constructor() { }

  public set sink(promise: Promise<any>) {
    this.push(promise);
  }

  public push(promise: Promise<any>): void {
    this.queue.push(promise);

    // If this is the only promise just run it
    if (this.queue.length === 1) {
      this.runNextPromise();
    }
  }

  private runNextPromise(): void {
    // Make sure there's something to run
    if (!this.queue.length) {
      return;
    }
    const item = this.queue.shift();
    item.then(() => {
      // Once it is done, go to the next promise
      this.runNextPromise();
    });
  }
}
