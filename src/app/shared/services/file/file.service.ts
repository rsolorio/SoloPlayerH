import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, resolve, extname } from 'path';
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

  getFileContent(filePath: string): string {
    const fileData = readFileSync(filePath, { encoding: 'utf8' });
    return this.removeBom(fileData.toString());
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
        const parts = itemPath.split('\\').reverse();
        const info: IFileInfo = {
          path: itemPath,
          fullName: parts[0],
          directoryPath: itemPath.replace(parts[0], ''),
          name: parts[0].split('.')[0],
          extension: extname(itemPath),
          parts,
          size: fileStat.size,
          addDate: fileStat.atime,
          changeDate: fileStat.mtime
        };
        const extensionSeparatorIndex = info.fullName.lastIndexOf('.');
        info.name = info.fullName.substring(0, extensionSeparatorIndex);
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

  getAbsolutePath(locationPath: string, endPath: string): string {
    return resolve(locationPath, endPath);
  }

  removeBom(value: string): string {
    // 0xFEFF = 65279
    if (value && value.charCodeAt(0) === 0xFEFF) {
      return value.substring(1);
    }
    return value;
  }
}
