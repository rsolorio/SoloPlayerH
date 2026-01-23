import { Observable } from 'rxjs';
import { IFileInfo } from './file.interface';

export abstract class FileService {

  constructor() { }

  abstract getBuffer(filePath: string): Promise<Buffer>;

  abstract writeBuffer(filePath: string, content: Buffer): Promise<void>;

  abstract writeText(filePath: string, content: string): Promise<void>;

  abstract appendText(filePath: string, content: string): Promise<void>;

  abstract getFiles(directoryPaths: string[]): Observable<IFileInfo>;

  abstract getDirectories(directoryPath?: string): Promise<IFileInfo[]>;

  abstract getParentPath(path: string): string;

  abstract getParentDir(path?: string): Promise<IFileInfo>;

  abstract getText(filePath: string): Promise<string>;

  abstract getAbsolutePath(locationPath: string, endPath: string): string;

  abstract getRelativePath(sourcePath: string, destinationPath: string): string;

  abstract getFileInfo(path: string): Promise<IFileInfo>;

  /**
   * Sets modified and access date of the specified file.
   * @param filePath The full path of the file.
   * @param modifiedDate The last time the contents of the file were modified (mtime)
   * @param accessDate The last time the file was read (atime)
   */
  abstract setTimes(filePath: string, modifiedDate: Date, accessDate: Date): void;

  abstract setAddDate(filePath: string, addDate: Date): Promise<string>;

  abstract exists(path: string): boolean;

  abstract copyFile(sourceFilePath: string, destinationFilePath: string): Promise<void>;

  abstract runCommand(command: string): Promise<string>;

  abstract openDirectory(directoryPath: string): Promise<string>;

  abstract createDirectory(directoryPath: string): Promise<void>;

  combine(...args: string[]): string {
    const separator = '\\';
    let result = ''
    args.forEach(path => {
      result += path;
      if (!path.endsWith(separator)) {
        result += separator;
      }
    });
    return result;
  }

  getDirectoryPath(filePath: string): string {
    return filePath.substring(0, filePath.lastIndexOf('\\'));
  }

  removeBom(value: string): string {
    // 0xFEFF = 65279
    if (value && value.charCodeAt(0) === 0xFEFF) {
      return value.substring(1);
    }
    return value;
  }

  test(): void {}
}
