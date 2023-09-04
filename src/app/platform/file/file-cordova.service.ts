import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IFileInfo } from './file.interface';
import { FileService } from './file.service';

@Injectable({
  providedIn: 'root'
})
export class FileCordovaService extends FileService {

  constructor() {
    super();
  }

  getBuffer(filePath: string): Promise<Buffer> {
    return null;
  }

  getText(filePath: string): Promise<string> {
    return null;
  }

  getFiles(directoryPaths: string[]): Observable<IFileInfo> {
    return null;
  }

  getAbsolutePath(locationPath: string, endPath: string): string {
    return null;
  }

  getFileInfo(path: string): Promise<IFileInfo> {
    return null;
  }

  exists(path: string): boolean {
    return false;
  }

  getDirectories(directoryPath?: string): Promise<IFileInfo[]> {
    return null;
  }

  copyFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
    return null;
  }

  public getParentPath(path: string): string {
    return null;
  }

  public getParentDir(path?: string): Promise<IFileInfo> {
    return null;
  }
}
