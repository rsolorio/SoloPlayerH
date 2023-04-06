import { Injectable } from '@angular/core';
import { ImageService } from './image.service';
import { FileService } from '../file/file.service';
import { AudioMetadataService } from '../audio-metadata/audio-metadata.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class ImageCordovaService extends ImageService {

  constructor(private fileService: FileService, private metadataService: AudioMetadataService, private utility: UtilityService) {
    super(fileService, metadataService, utility);
  }

  getScreenshot(delayMs?: number): Promise<string> {
    return null;
  }
}
