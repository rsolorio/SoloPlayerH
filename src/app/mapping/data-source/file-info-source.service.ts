import { Injectable } from '@angular/core';
import { IDataSourceParsed, IDataSourceService } from './data-source.interface';
import { MetaField } from '../data-transform/data-transform.enum';
import { FileService } from 'src/app/platform/file/file.service';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { IImageSource } from 'src/app/core/models/core.interface';
import { MusicImageSourceType, MusicImageType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { MimeType } from 'src/app/core/models/core.enum';

interface IJsonInfo {
  artistContent?: any;
  artistFilePath?: string;
  albumContent?: any;
  albumFilePath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileInfoSourceService implements IDataSourceService {
  protected inputData: IFileInfo;
  protected jsonInfo: IJsonInfo = {};
  constructor(private fileService: FileService) { }

  public async init(input: IFileInfo, entity: IDataSourceParsed): Promise<IDataSourceParsed> {
    if (this.inputData && this.inputData.path === input.path) {
      return entity;
    }
    this.inputData = input;

    const artistFilePath = this.findFile('artist.json', 1);
    if (artistFilePath) {
      if (artistFilePath !== this.jsonInfo.artistFilePath) {
        this.jsonInfo.artistFilePath = artistFilePath;
        const textContent = await this.fileService.getText(artistFilePath);
        if (textContent) {
          this.jsonInfo.artistContent = JSON.parse(textContent);
        }
      }
    }
    else {
      this.jsonInfo.artistContent = null;
      this.jsonInfo.artistFilePath = null;
    }

    const albumFilePath = this.findFile('album.json');
    if (albumFilePath) {
      if (albumFilePath !== this.jsonInfo.albumFilePath) {
        this.jsonInfo.albumFilePath = albumFilePath;
        const textContent = await this.fileService.getText(albumFilePath);
        if (textContent) {
          this.jsonInfo.albumContent = JSON.parse(textContent);
        }
      }
    }
    else {
      this.jsonInfo.albumContent = null;
      this.jsonInfo.albumFilePath = null;
    }

    return entity;
  }

  public async get(propertyName: string): Promise<any[]> {
    if (!this.inputData) {
      return null;
    }
    switch (propertyName) {
      case MetaField.FilePath:
        return [this.inputData.path];
      case MetaField.FileName:
        return [this.inputData.name];
      case MetaField.AddDate:
        return [this.inputData.addDate];
      case MetaField.ChangeDate:
        return [this.inputData.changeDate];
      case MetaField.FileSize:
        return [this.inputData.size];
      case MetaField.UnSyncLyrics:
        const lyrics = await this.getLyrics(this.inputData);
        if (lyrics) {
          return [lyrics];
        }
        break;
      case MetaField.ArtistImage:
      case MetaField.AlbumArtistImage:
      case MetaField.AlbumImage:
      case MetaField.AlbumSecondaryImage:
      case MetaField.SingleImage:
        return this.getImageFile(propertyName);
      case MetaField.ArtistStylized:
      case MetaField.Contributor:
      case MetaField.Singer:
        if (this.jsonInfo.artistContent) {
          const propertyValue = this.jsonInfo.artistContent[propertyName];
          if (propertyValue) {
            if (Array.isArray(propertyValue)) {
              return propertyValue;
            }
            return [this.jsonInfo.artistContent[propertyName]];
          }
        }
        break;
    }

    return [];
  }

  private findFile(fileName: string, levelsUp: number = 0): string {
    let result = '';
    let rootPath = this.inputData.directoryPath;
    for (let level = 0; level <= levelsUp; level++) {
      if (!result) {
        const filePath = rootPath + fileName;
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

  private getImageFile(field: MetaField): IImageSource[] {
    let fileName = '';
    let levelsUp = 0;
    let imageType = MusicImageType.Default;

    switch (field) {
      case MetaField.ArtistImage:
        fileName = 'artist.jpg';
        levelsUp = 1;
        imageType = MusicImageType.Artist;
        break;
      case MetaField.AlbumArtistImage:
        fileName = 'artist.jpg';
        levelsUp = 1;
        imageType = MusicImageType.Artist;
        break;
      case MetaField.AlbumImage:
        fileName = 'front.jpg';
        imageType = MusicImageType.Front;
        break;
      case MetaField.AlbumSecondaryImage:
        fileName = 'front2.jpg';
        imageType = MusicImageType.FrontAlternate;
        break;
      case MetaField.SingleImage:
        fileName = this.inputData.name + '.jpg';
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
          mimeType: MimeType.Jpg,
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