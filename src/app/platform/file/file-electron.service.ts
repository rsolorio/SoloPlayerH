import { Injectable } from '@angular/core';
import { promises, existsSync } from 'fs';
import { join, resolve, extname, parse, relative } from 'path';
import { Observable, Subscriber } from 'rxjs';
import { IFileInfo } from './file.interface';
import { FileService } from './file.service';
import { exec } from 'child_process';
const languageEncoding = require("detect-file-encoding-and-language");

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

  writeBuffer(filePath: string, content: Buffer): Promise<void> {
    return promises.writeFile(filePath, content);
  }

  writeText(filePath: string, content: string): Promise<void> {
    return promises.writeFile(filePath, content, { encoding: 'utf8' });
  }

  appendText(filePath: string, content: string): Promise<void> {
    return promises.appendFile(filePath, content, { encoding: 'utf8' });
  }

  createDirectory(directoryPath: string): Promise<void> {
    return promises.mkdir(directoryPath, { recursive: true });
  }

  async getText(filePath: string): Promise<string> {
    const buffer = await promises.readFile(filePath);
    const fileInfo = await languageEncoding(new Blob([buffer]));
    let result: string;
    switch (fileInfo.encoding) {
      case 'latin1':
      case 'ISO-8859-1':
      case 'CP1250':
      case 'CP1251':
      case 'CP1252':
      case 'CP1253':
      case 'CP1254':
      case 'CP1255':
      case 'CP1256':
      case 'CP1257':
        result = buffer.toString('latin1');
        break;
      default:
        result = buffer.toString('utf8');
        break;
    }
    return this.removeBom(result);
  }

  getFiles(directoryPaths: string[]): Observable<IFileInfo> {
    return new Observable<IFileInfo>(observer => {
      this.pushFiles(directoryPaths, observer).then(() => {
        observer.complete();
      });
    });
  }

  exists(path: string): boolean {
    return existsSync(path);
  }

  async copyFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
    const directoryPath = this.getDirectoryPath(destinationFilePath);
    // Hack to determine if this is not a drive
    if (!directoryPath.endsWith(':')) {
      await promises.mkdir(directoryPath, { recursive: true });
    }
    return promises.copyFile(sourceFilePath, destinationFilePath);
  }

  private async pushFiles(directoryPaths: string[], observer: Subscriber<IFileInfo>): Promise<void> {
    for (const directoryPath of directoryPaths) {
      const items = await this.getDirItems(directoryPath);
      for (const fileInfo of items) {
        if (fileInfo.isDirectory) {
          await this.pushFiles([fileInfo.path], observer);
        }
        else {
          observer.next(fileInfo);
        }
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
      // atime
      // - access time, the last time the file was read
      // - c#: FileInfo.LastAccessTime
      // mtime
      // - modified time, the last time the contents of the file were modified
      // - c#: FileInfo.LastWriteTime
      // ctime
      // - changed time, the last time the metadata related to the file was changed
      // - c#: FileInfo.LastWriteTime
      // birthtime
      // - the time of the creation of the file
      // - c#: FileInfo.CreationTime
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

  getRelativePath(sourcePath: string, destinationPath: string): string {
    return relative(sourcePath, destinationPath);
  }

  runCommand(command: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        else if (stderr) {
          reject(stderr);
        }
        else {
          resolve(stdout);
        }
      });
    });
  }

  openDirectory(directoryPath: string): Promise<string> {
    return this.runCommand(`start "" "${directoryPath}"`);
  }

  private getRootDirectories(): Promise<IFileInfo[]> {
    return this.runCommand('wmic logicaldisk get name').then(async response => {
      const lines = response.split('\r\r\n').map(value => value.trim());
      // Get only the drives
      const directories = lines.filter(value => /[A-Za-z]:/.test(value));
      const result: IFileInfo[] = [];
      for (const dir of directories) {
        const dirInfo = await this.getFileInfo(dir);
        result.push(dirInfo);
      }
      return result;
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
