import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { KeyValues } from 'src/app/core/models/core.interface';
import { Id3v2SourceService } from '../data-source/id3v2-source.service';
import { FileInfoSourceService } from '../data-source/file-info-source.service';
import { PathExpressionSourceService } from '../data-source/path-expression-source.service';
import { IDataSourceService } from '../data-source/data-source.interface';
import { DataSourceType } from '../data-source/data-source.enum';
import { MetaField } from './data-transform.enum';

/**
 * A transform service to retrieve metadata from a list of data sources;
 * it uses the specified profile to get a list of data sources.
 * It receives a file info object and returns a metadata (KeyValues) object.
 * This service assumes all the data sources have the same responsibility: read metadata from a file;
 * each data source type has an implicit way of reading metadata, but they all return
 * the same data type depending on the attribute being retrieved.
 * Each data source has its own configuration and its own list of supported fields to read.
 * Although a generic data source can have mappings, currently, data sources for the metadata reader don't
 * support mappings, which means that the mappings between the metadata and the database are "hardcoded"
 * and cannot be customized.
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataReaderService extends DataTransformServiceBase<IFileInfo, IFileInfo, KeyValues> {

  constructor(
    private log: LogService,
    private id3v2Service: Id3v2SourceService,
    private fileInfoService: FileInfoSourceService,
    private pathExpressionService: PathExpressionSourceService) {
    super();
  }

  public run(input: IFileInfo, fieldArrayOverride?: string[]): Promise<KeyValues> {
    return this.getData(input, fieldArrayOverride);
  }

  protected async getData(input: IFileInfo, fieldArrayOverride?: string[]): Promise<KeyValues> {
    // All values for a given destination will be saved in an array
    const result: KeyValues = {};
    for (const source of this.sources) {
      if (source.service) {
        const initResult = await source.service.setSource(input, source);
        if (initResult.error) {
          result[MetaField.Error] = [initResult.error];
          // TODO: continueOnError for other data sources
          return result;
        }
        else {
          await this.setValuesAndMappings(result, source, fieldArrayOverride);
        }
      }
      else {
        this.log.warn('Data source service not found for id: ' + source.id);
      }
    }
    return result;
  }

  protected getService(dataSourceType: string): IDataSourceService {
    switch (dataSourceType) {
      case DataSourceType.Id3v2:
        return this.id3v2Service;
      case DataSourceType.FileInfo:
        return this.fileInfoService;
      case DataSourceType.PathExpression:
        return this.pathExpressionService;
      default:
        return null;
    }
  }
}
