import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { LogService } from 'src/app/core/services/log/log.service';
import { IDataSourceService } from '../data-source/data-source.interface';
import { KeyValues } from 'src/app/core/models/core.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { DataSourceType } from '../data-source/data-source.enum';
import { SongModelSourceService } from '../data-source/song-model-source.service';
import { FileService } from 'src/app/platform/file/file.service';
import { MetaField } from './data-transform.enum';

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
    private fileService: FileService,
    private log: LogService,
    private entities: DatabaseEntitiesService,
    private songModelSource: SongModelSourceService) {
    super(entities);
  }

  public process(input: ISongModel): Promise<any> {
    // 1. Get the metadata
    const metadata = this.getData(input);
    // 2. Create the file
    this.fileService.copyFile(input.filePath, metadata[MetaField.FilePath]);
    // 3. Write metadata
    // TODO: this should return a log of the file save process
    return metadata;
  }

  protected async getData(input: ISongModel): Promise<KeyValues> {
    const result: KeyValues = {};
    for (const source of this.sources) {
      if (source.service) {
        const initResult = await source.service.init(input, source, this.syncProfile);
        if (!initResult.error) {
          await this.setValues(result, source.service, source.fieldArray);
        }
      }
    }
    return result;
  }

  protected getService(dataSourceType: string): IDataSourceService {
    switch(dataSourceType) {
      case DataSourceType.SongModel:
        return this.songModelSource;
      default:
        return null;
    }
  }
}
