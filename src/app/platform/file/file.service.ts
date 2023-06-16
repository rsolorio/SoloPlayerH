import { Observable } from 'rxjs';
import { IFileInfo } from './file.interface';

export abstract class FileService {

  constructor() { }

  abstract getBuffer(filePath: string): Promise<Buffer>;

  abstract getFiles(directoryPath: string): Observable<IFileInfo>;

  abstract getDirectories(directoryPath?: string): Promise<IFileInfo[]>;

  abstract getParentPath(path: string): string;

  abstract getParentDir(path?: string): Promise<IFileInfo>;

  abstract getText(filePath: string): Promise<string>;

  abstract getAbsolutePath(locationPath: string, endPath: string): string;

  abstract getFileInfo(path: string): Promise<IFileInfo>;

  abstract exists(path: string): boolean;

  removeBom(value: string): string {
    // 0xFEFF = 65279
    if (value && value.charCodeAt(0) === 0xFEFF) {
      return value.substring(1);
    }
    return value;
  }

  test(): void {}
}
