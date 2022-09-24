import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { IFileInfo } from './file.interface';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  getFilesAsync(directoryPath: string): Observable<IFileInfo> {
    const result = new Observable<IFileInfo>(observer => {
      this.pushFiles(directoryPath, observer);
      observer.complete();
    });
    return result;
  }

  private pushFiles(directoryPath: string, observer: Subscriber<IFileInfo>): void {
    const items = readdirSync(directoryPath);
    for (const item of items) {
      const itemPath = join(directoryPath, item);
      const fileStat = statSync(itemPath);
      if (fileStat.isDirectory()) {
        this.pushFiles(itemPath, observer);
      }
      else {
        const parts = itemPath.split('/').reverse();
        const info: IFileInfo = {
          path: itemPath,
          name: parts[0],
          parts,
          size: fileStat.size,
          addDate: fileStat.atime,
          changeDate: fileStat.mtime
        };
        observer.next(info);
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
