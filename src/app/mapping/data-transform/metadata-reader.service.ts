import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { KeyValues } from 'src/app/core/models/core.interface';
import { Id3v2SourceService } from '../data-source/id3v2-source.service';
import { FileInfoSourceService } from '../data-source/file-info-source.service';
import { PathExpressionSourceService } from '../data-source/path-expression-source.service';

/**
 * A transform service to retrieve metadata from a list of data sources;
 * it uses the specified profile to get a list of data sources.
 * It receives a file info object and returns a metadata (KeyValues) object.
 * This service assumes all the data sources have the same responsibility: read metadata from a file;
 * each data source type has an implicit way of reading metadata, but they all return
 * the same data type depending on the attribute being retrieved.
 * Each data source has its own configuration and its own list of supported fields to read.
 * Although a generic data source can have mappings, currently, data sources for the metadata reader don't
 * support mappings, which means that the mappings between the metadata and the database is "hardcoded"
 * and cannot be customized.
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

  public process(fileInfo: IFileInfo): Promise<KeyValues> {
    return this.getContext(fileInfo);
  }
}
