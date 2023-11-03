import { Injectable } from '@angular/core';
import { IDataSourceParsed, IDataSourceService } from './data-source.interface';
import { MetaField } from '../data-transform/data-transform.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IFileInfo } from 'music-metadata-browser';

@Injectable({
  providedIn: 'root'
})
export class PathExpressionSourceService implements IDataSourceService {
  protected inputData: IFileInfo;
  protected entityData: IDataSourceParsed;
  protected matchInfo: RegExpExecArray;
  protected regExpText: string;
  constructor(private utility: UtilityService) { }

  public init(): void {}

  public async setSource(input: IFileInfo, entity: IDataSourceParsed): Promise<IDataSourceParsed> {
    if (this.inputData && this.inputData.path === input.path && this.entityData.config === entity.config) {
      return entity;
    }

    if (!this.entityData || this.entityData.config !== entity.config) {
      // 1. Convert tokens into regex groups
      this.regExpText = entity.config;
      for (const field of entity.fieldArray) {
        const token = `%${field}%`;
        const group = `(?<${field}>[^\\\\]+)`;
        this.regExpText = this.regExpText.replace(token, group);
      }
      // 2. Escape backslashes since they are special characters in reg exp
      this.regExpText = this.regExpText.replace(/\\/g, '\\\\');
      // 3. Prepend dummy
      this.regExpText = '(?<dummy>.+)\\\\' + this.regExpText;
      // 4. Append extension
      const extension = this.getExtension(input.path);
      if (extension) {
        this.regExpText += '\\' + extension;
      }
    }

    const regExp = new RegExp(this.regExpText);
    this.matchInfo = regExp.exec(input.path);    
    this.inputData = input;
    this.entityData = entity;
    return entity;
  }

  public hasData(): boolean {
    return true;
  }

  public async getData(propertyName: string): Promise<any[]> {
    if (!this.matchInfo || !this.matchInfo.groups) {
      return [];
    }

    switch (propertyName) {
      case MetaField.Language:
      case MetaField.Genre:
      case MetaField.Artist:
      case MetaField.Album:
      case MetaField.Title:
        const valueText = this.matchInfo.groups[propertyName];
        if (valueText) {
          return [valueText];
        }
        break;
      case MetaField.Contributor:
        // Try to get contributors from the artist
        const artist = this.matchInfo.groups[MetaField.Artist];
        if (artist) {
          const artists = artist.split(' - ');
          if (artists.length > 1) {
            // Process contributors only if we were able to break down the main artist
            return artists;
          }
        }
        break;
      case MetaField.FeaturingArtist:
        const featuring: string[] = [];
        const title = this.matchInfo.groups[MetaField.Title];
        const bracketsContents = title.match(/(?<=\[).+?(?=\])/g);
        if (bracketsContents && bracketsContents.length) {
          for (const content of bracketsContents) {
            const artists = content.replace('feat ', '').replace('con ', '').split(',');
            for (const artistName of artists) {
              featuring.push(this.utility.toProperCase(artistName.trim()));
            }
          }
        }
        return featuring;
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
