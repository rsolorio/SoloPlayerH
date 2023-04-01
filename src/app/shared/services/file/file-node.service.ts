import { Injectable } from '@angular/core';
import { NativeImage, nativeImage } from 'electron';
import { promises, existsSync } from 'fs';
import { join, resolve, extname } from 'path';
import { Observable, Subscriber } from 'rxjs';
import { IFileInfo } from './file.interface';
import { FileService } from './file.service';
import { IImage } from 'src/app/core/models/core.interface';
import { ImageSrcType } from 'src/app/core/globals.enum';

@Injectable({
  providedIn: 'root'
})
export class FileNodeService extends FileService {

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
    const result = new Observable<IFileInfo>(observer => {
      this.pushFiles(directoryPath, observer).then(() => {
        observer.complete();
      });
    });
    return result;
  }

  exists(path: string): boolean {
    return existsSync(path);
  }

  private async pushFiles(directoryPath: string, observer: Subscriber<IFileInfo>): Promise<void> {
    const items = await this.getDirItems(directoryPath);
    for (const item of items) {
      const itemPath = join(directoryPath, item);
      const fileInfo = await this.getFileInfo(itemPath);
      if (fileInfo.isDirectory) {
        await this.pushFiles(itemPath, observer);
      }
      else {
        observer.next(fileInfo);
      }
    }
  }

  private getDirItems(directoryPath: string): Promise<string[]> {
    return promises.readdir(directoryPath);
  }

  public getFileInfo(path: string): Promise<IFileInfo> {
    return promises.stat(path).then (fileStat => {
      const info: IFileInfo = {
        isDirectory: fileStat.isDirectory(),
        path,
        parts: path.split('\\').reverse(),
        size: fileStat.size,
        addDate: fileStat.atime,
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
      return info;
    });
  }

  getAbsolutePath(locationPath: string, endPath: string): string {
    return resolve(locationPath, endPath);
  }

  async shrinkImage(image: IImage, size: number): Promise<string> {
    let imageObj: NativeImage;
    if (image.srcType === ImageSrcType.DataUrl) {
      imageObj = nativeImage.createFromDataURL(image.src);
    }
    else if (image.srcType === ImageSrcType.FileUrl) {
      // Remove the text: file://
      const filePath = image.src.slice(7);
      imageObj = nativeImage.createFromPath(filePath);
    }

    if (!imageObj) {
      return null;
    }

    const currentSize = imageObj.getSize();
    const newSize = this.shrink({ width: currentSize.width, height: currentSize.height }, size);
    if (!newSize) {
      return null;
    }

    return imageObj.resize({ width: newSize.width, height: newSize.height }).toDataURL();
  }
}
