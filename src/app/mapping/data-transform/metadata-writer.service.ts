import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { Id3v2SourceService } from '../data-source/id3v2-source.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { FileInfoSourceService } from '../data-source/file-info-source.service';
import { PathExpressionSourceService } from '../data-source/path-expression-source.service';
import { IDataSourceService } from '../data-source/data-source.interface';
import { KeyValues } from 'src/app/core/models/core.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';

/**
 * A transform service to save metadata to an audio file.
 * It uses the specified profile to get a list of data sources;
 * data sources have the responsibility of reading metadata and pass it to the writer.
 * Data sources support custom mapping, but the mapping is not used to get a different version of the metadata;
 * the mapping of the data source is used to tell the writer where the metadata will be saved.
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataWriterService extends DataTransformServiceBase<ISongModel, any> {

  constructor(
    private utility: UtilityService,
    private log: LogService,
    private id3v2Service: Id3v2SourceService,
    private fileInfoService: FileInfoSourceService,
    private entities: DatabaseEntitiesService,
    private pathExpressionService: PathExpressionSourceService) {
    super(entities);
  }

  public process(input: ISongModel): Promise<any> {
    // TODO: this should return a log of the file save process
    return this.getData(input);
  }

  protected async getData(input: ISongModel): Promise<KeyValues> {
    return null;
  }

  protected getService(dataSourceType: string): IDataSourceService {
    return null;
  }
}
