import { Injectable } from '@angular/core';
import * as musicMetadata from 'music-metadata-browser';

@Injectable({
  providedIn: 'root'
})
export class MusicMetadataService {

  constructor() { }

  public getMetadata(filePath: string): Promise<musicMetadata.IAudioMetadata> {
    const url = 'file://' + filePath;
    return musicMetadata.fetchFromUrl(url).then(metadata => {
      return metadata;
    });
  }
}
