import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PromiseQueueService {
  private queue: (() => Promise<any>)[] = [];
  constructor() { }

  public set sink(promise: () => Promise<any>) {
    this.push(promise);
  }

  public push(promise: () => Promise<any>): void {
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
    // Just get the promise to run
    const item = this.queue[0];
    item().then(() => {
      // Now that it is done delete it
      this.queue.shift();
      // Once it is done, go to the next promise
      this.runNextPromise();
    });
  }
}
