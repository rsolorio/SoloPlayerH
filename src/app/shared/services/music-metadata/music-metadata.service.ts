import { Injectable } from '@angular/core';
import { fetchFromUrl, IAudioMetadata, ITag } from 'music-metadata-browser';
import { IFileInfo } from './music-metadata.interface';

@Injectable({
  providedIn: 'root'
})
/**
 * Exposes methods to parse music tags.
 * Based on: https://github.com/Borewit/music-metadata-browser
 * You can test the library here: https://audio-tag-analyzer.netlify.app/
 */
export class MusicMetadataService {

  constructor() { }

  public async getMetadata(filePath: string, enforceDuration?: boolean): Promise<IFileInfo> {
    const url = 'file://' + filePath;
    const fileInfo: IFileInfo = {
      metadata: await fetchFromUrl(url),
      filePath,
      paths: filePath.split('\\').reverse(),
      fullyParsed: false
    };
    if (enforceDuration && !fileInfo.metadata.format.duration) {
      fileInfo.metadata = await fetchFromUrl(url, { duration: true });
      fileInfo.fullyParsed = true;
    }
    return fileInfo;
  }

  public getId3v24Tags(metadata: IAudioMetadata): ITag[] {
    return metadata.native['ID3v2.4'];
  }

  public getId3v24Tag<T>(tagId: string, metadata: IAudioMetadata, isUserDefined?: boolean): T {
    let result = null;
    const tags = this.getId3v24Tags(metadata);
    if (tags && tags.length) {
      const actualTagId = isUserDefined ? 'TXXX:' + tagId.toUpperCase() : tagId.toUpperCase();
      for (const tag of tags) {
        if (tag.id.toUpperCase() === actualTagId) {
          if (tag.value) {
            result = tag.value;
          }
          break;
        }
      }
    }
    return result as T;
  }

  public getId3v24Identifier(metadata: IAudioMetadata): string {
    let result: string = null;
    const tags = this.getId3v24Tags(metadata);
    for (const tag of tags) {
      if (tag.id === 'UFID') {
        if (tag.value && tag.value.identifier) {
          result = tag.value.identifier.toString();
        }
        break;
      }
    }
    return result;
  }
}
