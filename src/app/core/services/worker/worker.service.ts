import { Injectable } from '@angular/core';

export enum WorkerName {
  ColorPalette = 'ColorPalette'
}

/**
 * Angular service that uses the Web Worker API to fire workers.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkerService {

  constructor() { }

  public run<TInput, TResult>(name: WorkerName, inputData: TInput): Promise<TResult> {
    return new Promise<TResult>(resolve => {
      if (typeof Worker === 'undefined') {
        resolve(null);
      }
      else {
        let worker: Worker;
        switch (name) {
          case WorkerName.ColorPalette:
            worker = new Worker('../../workers/color-palette.worker', { type: 'module' });
            break;
        }
        worker.onmessage = response => {
          const result = response.data as TResult;
          resolve(result);
        };
        worker.postMessage(inputData);
      }
    });
  }
}
