import { Injectable } from '@angular/core';
import { promises, existsSync } from 'fs';
import { join, resolve, extname, parse } from 'path';
import { exec } from 'child_process';
import { Observable, Subscriber } from 'rxjs';
import { IFileInfo } from './file.interface';
import { FileService } from './file.service';

@Injectable({
  providedIn: 'root'
})
export class FileElectronService extends FileService {

  constructor() {
    super();
  }

  getBuffer(filePath: string): Promise<Buffer> {
    return promises.readFile(filePath);
  }

  getText(filePath: string): Promise<string> {
    return promises.readFile(filePath, { encoding: 'utf8' }).then(data => {
      return this.removeBom(data.toString());
    });
  }

  getFiles(directoryPath: string): Observable<IFileInfo> {
    return new Observable<IFileInfo>(observer => {
      this.pushFiles(directoryPath, observer).then(() => {
        observer.complete();
      });
    });
  }

  exists(path: string): boolean {
    return existsSync(path);
  }

  private async pushFiles(directoryPath: string, observer: Subscriber<IFileInfo>): Promise<void> {
    const items = await this.getDirItems(directoryPath);
    for (const fileInfo of items) {
      if (fileInfo.isDirectory) {
        await this.pushFiles(fileInfo.path, observer);
      }
      else {
        observer.next(fileInfo);
      }
    }
  }

  public async getDirectories(directoryPath?: string): Promise<IFileInfo[]> {
    if (directoryPath) {
      const items = await this.getDirItems(directoryPath);
      return items.filter(item => item.isDirectory);
    }
    return this.getRootDirectories();
  }

  public getParentPath(path: string): string {
    return join(path, '../');
  }

  public getParentDir(path?: string): Promise<IFileInfo> {
    const newPath = this.getParentPath(path);
    return this.getFileInfo(newPath);
  }

  private async getDirItems(directoryPath: string): Promise<IFileInfo[]> {
    const result: IFileInfo[] = [];
    const items = await promises.readdir(directoryPath);
    for (const item of items) {
      const itemPath = join(directoryPath, item);
      const fileInfo = await this.getFileInfo(itemPath);
      result.push(fileInfo);
    }
    return result;
  }

  public async getFileInfo(path: string): Promise<IFileInfo> {
    let info: IFileInfo;
    try {
      // Stats
      // atime: access time, the last time the file was read
      // mtime: modified time, the last time the contents of the file were modified
      // ctime: changed time, the last time the metadata related to the file was changed
      // birthtime: the time of the creation of the file
      const fileStat = await promises.stat(path);
      info = {
        isDirectory: fileStat.isDirectory(),
        path,
        // Remove empty items as well
        parts: path.split('\\').filter(item => !!item).reverse(),
        size: fileStat.size,
        addDate: fileStat.birthtime,
        changeDate: fileStat.mtime
      };
      info.fullName = info.parts[0];
      if (info.isDirectory) {
        info.name = info.fullName;
        info.directoryPath = info.path;
      }
      else {
        const extensionSeparatorIndex = info.fullName.lastIndexOf('.');
        if (extensionSeparatorIndex > 0) {
          info.name = info.fullName.substring(0, extensionSeparatorIndex);
        }
        else {
          info.name = info.fullName;
        }
        info.directoryPath = info.path.replace(info.parts[0], '');
        info.extension = extname(info.path);
      }
    }
    catch (error) {
      info = {
        hasError: true,
        isDirectory: true,
        path: path,
        parts: [],
        size: 0
      }
    }

    return info;
  }

  getAbsolutePath(locationPath: string, endPath: string): string {
    return resolve(locationPath, endPath);
  }

  private getRootDirectories(): Promise<IFileInfo[]> {
    return new Promise<IFileInfo[]>((resolve, reject) => {
      exec('wmic logicaldisk get name', async (error, stdout) => {
        if (error) {
          reject(error);
        }
        else {
          const lines = stdout.split('\r\r\n').map(value => value.trim());
          // Get only the drives
          const directories = lines.filter(value => /[A-Za-z]:/.test(value));
          const result: IFileInfo[] = [];
          for (const dir of directories) {
            const dirInfo = await this.getFileInfo(dir);
            result.push(dirInfo);
          }
          resolve(result);
        }
      });
    });
  }

  test(): void {
    const directoryPath = 'F:';
    promises.readdir(directoryPath).then(items => {
      console.log(items);
    });
    promises.stat(directoryPath).then(stat => {
      console.log(stat);
      console.log(stat.isDirectory());
    });
    const x = parse(directoryPath);
    console.log(x);
  }
}
