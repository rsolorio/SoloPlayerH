import { Injectable } from '@angular/core';
import { IAudioMetadata, IPicture, ITag, parseBuffer } from 'music-metadata-browser';
import { IImage } from 'src/app/core/models/core.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { AttachedPictureType, MusicImageType } from './audio-metadata.enum';
import { IAudioInfo, IPictureTag } from './audio-metadata.interface';
import { ImageSrcType } from 'src/app/core/models/core.enum';

@Injectable({
  providedIn: 'root'
})
/**
 * Exposes methods to parse music tags.
 * Based on: https://github.com/Borewit/music-metadata-browser
 * You can test the library here: https://audio-tag-analyzer.netlify.app/
 */
export class AudioMetadataService {

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

  /**
   * Brings one picture for each image type.
   */
  public getPictures(audioMetadata: IAudioMetadata, types: MusicImageType[]): IPicture[] {
    const result: IPicture[] = [];
    if (audioMetadata.common.picture && audioMetadata.common.picture.length) {
      for (const imageType of types) {
        const picture = audioMetadata.common.picture.find(pic => this.getImageType(pic) === imageType);
        if (picture) {
          result.push(picture);
        }
      }
    }
    return result;
  }

  public getImage(pictures: IPicture[]): IImage {
    if (pictures && pictures.length) {
      const picture = pictures[0];
      if (picture && picture.data) {
        return {
          src: `data:${picture.format};base64,` + picture.data.toString('base64'),
          srcType: ImageSrcType.DataUrl
        };
      }
    }
    return {};
  }

  public getImageType(picture: IPictureTag): MusicImageType {
    const pictureType = picture.type ? picture.type.toLowerCase() : AttachedPictureType.Other.toLowerCase();
    switch (pictureType) {
      case AttachedPictureType.Other.toLowerCase():
        if (picture.description.toLowerCase() === MusicImageType.Single.toLowerCase()) {
          return MusicImageType.Single;
        }
        return MusicImageType.Other;
      case AttachedPictureType.Front.toLowerCase():
        return MusicImageType.Front;
      case AttachedPictureType.Back.toLowerCase():
        return MusicImageType.Back;
      case AttachedPictureType.Artist.toLowerCase():
        return MusicImageType.Artist;
    }
    return MusicImageType.Other;
  }
}