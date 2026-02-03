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

  writeBuffer(filePath: string, content: Buffer): Promise<void> {
    return null;
  }

  writeText(filePath: string, content: string): Promise<void> {
    return null;
  }

  appendText(filePath: string, content: string): Promise<void> {
    return null;
  }

  prependText(filePath: string, content: string): Promise<void> {
    return null;
  }

  createDirectory(directoryPath: string): Promise<void> {
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

  setTimes(filePath: string, modifiedDate: Date, accessDate: Date): void {
    //
  }

  setAddDate(filePath: string, addDate: Date): Promise<string> {
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

  runCommand(command: string): Promise<any> {
    return null;
  }

  openDirectory(directoryPath: string): Promise<string> {
    return null;
  }

  public getParentPath(path: string): string {
    return null;
  }

  getRelativePath(sourcePath: string, destinationPath: string): string {
    return null
  }

  public getParentDir(path?: string): Promise<IFileInfo> {
    return null;
  }
}
