import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { Id3v2SourceService } from '../data-source/id3v2-source.service';
import { IFileInfo } from 'src/app/platform/file/file.interface';

/**
 * A transform service to save metadata to an audio file.
 * It uses the specified profile to get a list of mappings that define source/destination items.
 * Each destination will be represented as a property in an object that will be used get the metadata.
 * If the name of a destination is changed, the code used to save the metadata into the file
 * will need to be updated.
 * TODO: create an interface with fixed properties 
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataWriterService extends DataTransformServiceBase {

  constructor(private utility: UtilityService, id3v2: Id3v2SourceService) {
    super(utility, id3v2);
  }

  public process(fileInfo: IFileInfo): Promise<any> {
    // TODO: this should return a log of the file save process
    return this.getContext(fileInfo);
  }
}