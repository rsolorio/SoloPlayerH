import { Injectable } from '@angular/core';
import { IDataSource, ILoadInfo } from './data-source.interface';
import { MetaField } from '../data-transform/data-transform.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class PathExpressionSourceService implements IDataSource {
  protected loadInfo: ILoadInfo;
  protected matchInfo: RegExpExecArray;
  protected regExpText: string;
  constructor(private utility: UtilityService) { }

  public async load(info: ILoadInfo): Promise<ILoadInfo> {
    if (this.loadInfo && this.loadInfo.filePath === info.filePath && this.loadInfo.config === info.config) {
      return info;
    }

    if (!this.loadInfo || this.loadInfo.config !== info.config) {
      // 1. Convert tokens into regex groups
      this.regExpText = info.config;
      for (const field of info.fieldArray) {
        const token = `%${field}%`;
        const group = `(?<${field}>[^\\\\]+)`;
        this.regExpText = this.regExpText.replace(token, group);
      }
      // 2. Escape backslashes since they are special characters in reg exp
      this.regExpText = this.regExpText.replace(/\\/g, '\\\\');
      // 3. Prepend dummy
      this.regExpText = '(?<dummy>.+)\\\\' + this.regExpText;
      // 4. Append extension
      const extension = this.getExtension(info.filePath);
      if (extension) {
        this.regExpText += '\\' + extension;
      }
    }

    const regExp = new RegExp(this.regExpText);
    this.matchInfo = regExp.exec(info.filePath);    
    this.loadInfo = info;
    return this.loadInfo;
  }

  public async get(propertyName: string): Promise<any[]> {
    if (!this.matchInfo || !this.matchInfo.groups) {
      return [];
    }

    switch (propertyName) {
      case MetaField.Language:
      case MetaField.Genre:
      case MetaField.AlbumArtist:
      case MetaField.Album:
      case MetaField.Title:
        const valueText = this.matchInfo.groups[propertyName];
        if (valueText) {
          return [valueText];
        }
        break;
      case MetaField.Artist:
        const result: any[] = [];
        // Album artist
        const mainArtist = this.matchInfo.groups[propertyName];
        if (mainArtist) {
          result.push(mainArtist);
        }
        // Associated artists
        const title = this.matchInfo.groups[MetaField.Title];
        const bracketsContents = title.match(/(?<=\[).+?(?=\])/g);
        if (bracketsContents && bracketsContents.length) {
          for (const content of bracketsContents) {
            const artists = content.replace('feat ', '').replace('con ', '').split(',');
            for (const artistName of artists) {
              result.push(this.utility.toProperCase(artistName.trim()));
            }
          }
        }
        return result;
      case MetaField.Year:
      case MetaField.MediaNumber:
      case MetaField.TrackNumber:
        const valueNumber = this.matchInfo.groups[propertyName];
        if (valueNumber) {
          const number = parseInt(valueNumber, 10);
          if (number && !Number.isNaN(number)) {
            return [number];
          }
        }
        break;
    }
    return [];
  }

  private getExtension(filePath: string): string {
    const matches = filePath.match(/\.[0-9a-z]+$/i);
    if (matches && matches.length) {
      return matches[0];
    }
    return null;
  }
}
