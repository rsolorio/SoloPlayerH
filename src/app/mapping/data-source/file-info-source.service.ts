import { Injectable } from '@angular/core';
import { IDataSource, ILoadInfo } from './data-source.interface';
import { OutputField } from '../data-transform/data-transform.enum';
import { FileService } from 'src/app/platform/file/file.service';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { IImageSource } from 'src/app/core/models/core.interface';
import { MusicImageSourceType, MusicImageType, PictureFormat } from 'src/app/platform/audio-metadata/audio-metadata.enum';

@Injectable({
  providedIn: 'root'
})
export class FileInfoSourceService implements IDataSource {
  protected loadInfo: ILoadInfo;
  protected fileInfo: IFileInfo;
  constructor(private fileService: FileService) { }

  public async load(info: ILoadInfo): Promise<ILoadInfo> {
    if (this.loadInfo && this.loadInfo.filePath === info.filePath) {
      return info;
    }
    this.loadInfo = info;
    this.fileInfo = await this.fileService.getFileInfo(info.filePath);
    return this.loadInfo;
  }

  public async get(propertyName: string): Promise<any[]> {
    if (!this.loadInfo) {
      return null;
    }
    switch (propertyName) {
      case OutputField.FilePath:
        return [this.fileInfo.path];
      case OutputField.FileName:
        return [this.fileInfo.name];
      case OutputField.AddDate:
        return [this.fileInfo.addDate];
      case OutputField.ChangeDate:
        return [this.fileInfo.changeDate];
      case OutputField.FileSize:
        return [this.fileInfo.size];
      case OutputField.UnSyncLyrics:
        const lyrics = await this.getLyrics(this.fileInfo);
        if (lyrics) {
          return [lyrics];
        }
        break;
      case OutputField.ArtistImage:
      case OutputField.AlbumArtistImage:
      case OutputField.AlbumImage:
      case OutputField.AlbumSecondaryImage:
      case OutputField.SingleImage:
        return this.getImageFile(propertyName);
    }

    return [];
  }

  private findFile(fileName: string, levelsUp: number = 0): string {
    let result = '';
    let rootPath = this.fileInfo.directoryPath;
    for (let level = 0; level <= levelsUp; level++) {
      if (!result) {
        const filePath = rootPath + '\\' + fileName;
        if (this.fileService.exists(filePath)) {
          result = filePath;
        }
        else {
          rootPath = this.fileService.getParentPath(rootPath);
        }
      }
    }
    return result;
  }

  private getImageFile(field: OutputField): IImageSource[] {
    let fileName = '';
    let levelsUp = 0;
    let imageType = MusicImageType.Default;

    switch (field) {
      case OutputField.ArtistImage:
        fileName = 'artist.jpg';
        levelsUp = 1;
        imageType = MusicImageType.Artist;
        break;
      case OutputField.AlbumArtistImage:
        fileName = 'artist.jpg';
        levelsUp = 1;
        imageType = MusicImageType.Artist;
        break;
      case OutputField.AlbumImage:
        fileName = 'front.jpg';
        imageType = MusicImageType.Front;
        break;
      case OutputField.AlbumSecondaryImage:
        fileName = 'front2.jpg';
        imageType = MusicImageType.FrontAlternate;
        break;
      case OutputField.SingleImage:
        fileName = this.fileInfo.name + 'jpg';
        imageType = MusicImageType.Single;
        break;
    }

    if (fileName) {
      const filePath = this.findFile(fileName, levelsUp);
      if (filePath) {
        const imageData: IImageSource = {
          sourcePath: filePath,
          sourceType: MusicImageSourceType.ImageFile,
          sourceIndex: 0,
          mimeType: PictureFormat.Jpg,
          imageType: imageType
        };
        return [imageData];
      }
    }

    return [];
  }

  private async getLyrics(fileInfo: IFileInfo): Promise<string> {
    const filePath = fileInfo.path.replace(fileInfo.extension, '.txt');
    if (this.fileService.exists(filePath)) {
      return await this.fileService.getText(filePath);
    }
    return null;
  }
}