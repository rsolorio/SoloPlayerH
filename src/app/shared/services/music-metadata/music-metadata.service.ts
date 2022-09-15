import { Injectable } from '@angular/core';
import { fetchFromUrl, IAudioMetadata, ITag } from 'music-metadata-browser';

@Injectable({
  providedIn: 'root'
})
export class MusicMetadataService {

  constructor() { }

  public getMetadata(filePath: string): Promise<IAudioMetadata> {
    const url = 'file://' + filePath;
    return fetchFromUrl(url).then(metadata => {
      return metadata;
    });
  }

  public getId3v24Tags(metadata: IAudioMetadata): ITag[] {
    return metadata.native['ID3v2.4'];
  }

  public getId3v24String(tagId: string, metadata: IAudioMetadata): string {
    let result: string = null;
    const tags = this.getId3v24Tags(metadata);
    for (const tag of tags) {
      if (tag.id === tagId) {
        if (tag.value) {
          result = tag.value.toString();
        }
        break;
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
}
