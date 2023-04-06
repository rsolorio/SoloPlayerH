import { Observable } from 'rxjs';
import { IImage, ISize } from 'src/app/core/models/core.interface';
import { IFileInfo } from './file.interface';

export abstract class FileService {

  constructor() { }

  abstract getBuffer(filePath: string): Promise<Buffer>;

  abstract getFiles(directoryPath: string): Observable<IFileInfo>;

  abstract getText(filePath: string): Promise<string>;

  abstract getAbsolutePath(locationPath: string, endPath: string): string;

  abstract getFileInfo(path: string): Promise<IFileInfo>;

  abstract exists(path: string): boolean;

  abstract getRootDirectories(): Promise<string[]>;

  shrinkImage(image: IImage, newSize: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const imageElement = new Image();
        imageElement.onload = () => {
          const size = this.shrink({ width: imageElement.naturalWidth, height: imageElement.naturalHeight }, newSize);
          if (!size) {
            resolve(null);
          }
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = size.width;
          canvas.height = size.height;
          context.drawImage(imageElement, 0, 0, size.width, size.height);
          resolve(canvas.toDataURL());
        };
        imageElement.src = image.src;
      }
      catch (err) {
        reject(err);
      }
    });
  }

  shrink(size: ISize, newSize: number): ISize {
    if (size.width > size.height) {
      if (size.width > newSize) {
        return {
          width: newSize,
          height: size.height * (newSize / size.width)
        };
      }
    }
    else {
      if (size.height > newSize) {
        return {
          height: newSize,
          width: size.width * (newSize / size.height)
        }
      }
    }
    return null;
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
