import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { readdir, stat, readFile, Stats } from 'fs';
import { join, resolve, extname } from 'path';
import { IFileInfo } from './file.interface';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  getBuffer(filePath: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      readFile(filePath, (readError, data) => {
        if (readError) {
          reject(readError);
        }
        else {
          resolve(data);
        }
      });
    });
  }

  getFiles(directoryPath: string): Observable<IFileInfo> {
    const result = new Observable<IFileInfo>(observer => {
      this.pushFiles(directoryPath, observer).then(() => {
        observer.complete();
      });
    });
    return result;
  }

  getFileContent(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      readFile(filePath, { encoding: 'utf8' }, (readError, data) => {
        if (readError) {
          reject(readError);
        }
        else {
          resolve(this.removeBom(data.toString()));
        }
      });
    });
  }

  private async pushFiles(directoryPath: string, observer: Subscriber<IFileInfo>): Promise<void> {
    const items = await this.getDirItems(directoryPath);
    for (const item of items) {
      const itemPath = join(directoryPath, item);
      const fileStat = await this.getStats(itemPath);
      if (fileStat.isDirectory()) {
        await this.pushFiles(itemPath, observer);
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

  private getDirItems(directoryPath: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      readdir(directoryPath, (readError, items) => {
        if (readError) {
          reject(readError);
        }
        else {
          resolve(items);
        }
      });
    });
  }

  private getStats(path: string): Promise<Stats> {
    return new Promise<Stats>((resolve, reject) => {
      stat(path, (readError, stats) => {
        if (readError) {
          reject(readError);
        }
        else {
          resolve(stats);
        }
      });
    });
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
