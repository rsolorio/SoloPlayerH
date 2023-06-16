import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { LogService } from 'src/app/core/services/log/log.service';

/**
 * A transform service to retrieve metadata from a list of data sources.
 * It uses the specified profile to get a list of mappings that define source/destination items.
 * Each destination will be represented as a property in an object that will be returned in the process method.
 * If the name of a destination is changed, any code using this service will need to be updated.
 * TODO: create an interface with fixed properties available as destinations.
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataReaderService extends DataTransformServiceBase {

  constructor(private utility: UtilityService, log: LogService) {
    super(utility, log);
  }

  public process(fileInfo: IFileInfo): Promise<any> {
    return this.getContext(fileInfo);
  }
}
