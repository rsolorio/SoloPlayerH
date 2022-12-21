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

  getFiles(directoryPath: string): Observable<IFileInfo> {
    return null;
  }

  getAbsolutePath(locationPath: string, endPath: string): string {
    return null;
  }

  getFileInfo(path: string): Promise<IFileInfo> {
    return null;
  }
}
