import { Injectable } from '@angular/core';
import { IAudioMetadata, IPicture, ITag, parseBuffer } from 'music-metadata-browser';
import { LogService } from 'src/app/core/services/log/log.service';
import { IAudioInfo } from './music-metadata.interface';

@Injectable({
  providedIn: 'root'
})
/**
 * Exposes methods to parse music tags.
 * Based on: https://github.com/Borewit/music-metadata-browser
 * You can test the library here: https://audio-tag-analyzer.netlify.app/
 */
export class MusicMetadataService {

  constructor(private log: LogService) { }

  public async getMetadata(data: Buffer, enforceDuration?: boolean): Promise<IAudioInfo> {
    const result: IAudioInfo = {
      metadata: null,
      fullyParsed: false
    };

    try {
      result.metadata = await parseBuffer(data);
    }
    catch (error) {
      this.log.error('Parse buffer failure while getting metadata.', error);
      result.error = error;
    }

    if (!result.error && enforceDuration && !result.metadata.format.duration) {
      this.log.warn('Duration not found. Re-parsing the data.');
      try {
        result.metadata = await parseBuffer(data,  null, { duration: true});
        result.fullyParsed = true;
      }
      catch (error) {
        this.log.error('Parse buffer failure while getting metadata.', error);
        result.error = error;
      }
    }

    return result;
  }

  public getId3v24Tags(metadata: IAudioMetadata): ITag[] {
    return metadata.native['ID3v2.4'];
  }

  public getTag<T>(tagId: string, tags: ITag[], isUserDefined?: boolean): T {
    let result = null;
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

  public getTags<T>(tagId: string, tags: ITag[], isUserDefined?: boolean): T[] {
    const result: T[] = [];

    if (tags && tags.length) {
      const actualTagId = isUserDefined ? 'TXXX:' + tagId.toUpperCase() : tagId.toUpperCase();
      for (const tag of tags) {
        if (tag.id.toUpperCase() === actualTagId) {
          const value = tag.value as T;
          if (value !== null) {
            result.push(value);
          }
        }
      }
    }

    return result;
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

  public getPictureDataUrl(audioMetadata: IAudioMetadata, type?: string): string {
    let picture: IPicture = null;
    if (audioMetadata.common.picture && audioMetadata.common.picture.length) {
      if (type) {
        picture = audioMetadata.common.picture.find(item => {
          return item.type && item.type.toLowerCase() === type.toLowerCase();
        });

        // If not found by type, use description
        if (!picture) {
          picture = audioMetadata.common.picture.find(item => {
            return item.description && item.description.toLowerCase() === type.toLowerCase();
          });
        }
      }
      else {
        // If no type specified get the first one
        picture = audioMetadata.common.picture[0];
      }
    }

    if (picture) {
      return 'data:image/jpg;base64,' + picture.data.toString('base64');
    }
    return null;
  }
}
