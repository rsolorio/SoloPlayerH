import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  getFilesAsync(directoryPath: string): Observable<string> {
    const result = new Observable<string>(observer => {
      this.pushFiles(directoryPath, observer);
      observer.complete();
    });
    return result;
  }

  private pushFiles(directoryPath: string, observer: Subscriber<string>): void {
    const items = readdirSync(directoryPath);
    for (const item of items) {
      const itemPath = join(directoryPath, item);
      if (statSync(itemPath).isDirectory()) {
        this.pushFiles(itemPath, observer);
      }
      else {
        observer.next(itemPath);
      }
    }
  }

  getFiles(directoryPath: string, filePaths: string[]): void {
    if (!filePaths) {
      filePaths = [];
    }

    const items = readdirSync(directoryPath);
    for (const item of items) {
      const itemPath = join(directoryPath, item);
      if (statSync(itemPath).isDirectory()) {
        this.getFiles(itemPath, filePaths);
      }
      else {
        filePaths.push(itemPath);
      }
    }
  }
}
