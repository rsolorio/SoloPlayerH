import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { KeyValues } from 'src/app/core/models/core.interface';
import { DataTransformId } from './data-transform.enum';
import { Id3v2SourceService } from '../data-source/id3v2-source.service';
import { FileInfoSourceService } from '../data-source/file-info-source.service';
import { PathExpressionSourceService } from '../data-source/path-expression-source.service';

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
export class MetadataReaderService extends DataTransformServiceBase<KeyValues> {

  constructor(
    private utility: UtilityService,
    private log: LogService,
    private id3v2Service: Id3v2SourceService,
    private fileInfoService: FileInfoSourceService,
    private pathExpressionService: PathExpressionSourceService) {
    super(utility, log, id3v2Service, fileInfoService, pathExpressionService);
  }

  protected get profileId(): string {
    return DataTransformId.MetadataReader;
  }

  public process(fileInfo: IFileInfo): Promise<KeyValues> {
    return this.getContext(fileInfo);
  }
}
