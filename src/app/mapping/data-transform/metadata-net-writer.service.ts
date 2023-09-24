import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { IDataSourceService } from '../data-source/data-source.interface';
import { KeyValues } from 'src/app/core/models/core.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { DataSourceType } from '../data-source/data-source.enum';
import { SongModelSourceService } from '../data-source/song-model-source.service';
import { FileService } from 'src/app/platform/file/file.service';
import { MetaField } from './data-transform.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

/**
 * A transform service to save metadata to an audio file.
 * It uses the specified profile to get a list of data sources;
 * data sources have the responsibility of reading metadata and pass it to the writer.
 * Data sources support custom mapping.
 * The writer relies the write mechanism on a .net tool I built myself using TagLibSharp
 * since I did not find a package that supports writing Id3v2.4 tags with multiple artists and genres.
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataNetWriterService extends DataTransformServiceBase<ISongModel, ISongModel, any> {

  constructor(
    private fileService: FileService,
    private utility: UtilityService,
    private songModelSource: SongModelSourceService) {
    super();
  }

  public async run(input: ISongModel): Promise<any> {
    // 1. Get the metadata
    const metadata = await this.getData(input);
    // 2. Create the file
    const filePath = this.utility.first(metadata[MetaField.FilePath]);
    await this.fileService.copyFile(input.filePath, filePath);
    // 3. Write metadata
    await this.writeMetadata(metadata);
    // TODO: this should return a log of the file save process
    return metadata;
  }

  protected async getData(input: ISongModel): Promise<KeyValues> {
    const result: KeyValues = {};
    for (const source of this.sources) {
      if (source.service) {
        const initResult = await source.service.setSource(input, source, this.syncProfile);
        if (!initResult.error) {
          await this.setValuesAndMappings(result, source);
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

  private async writeMetadata(metadata: KeyValues): Promise<void> {
    await this.fileService.runCommand(this.createCommand(metadata));
  }

  private createCommand(metadata: KeyValues): string {
    const id3UtilityFilePath = 'F:\\Code\\VS Online\\SoloSoft\\Bin46\\Id3Command.exe';
    const jsonText = JSON.stringify(metadata);
    // We don't need to escape single backslashes since they are escaped when the object is stringified
    let escapedJsonText = jsonText.replace(new RegExp('"', 'g'), '\\"');
    escapedJsonText = escapedJsonText.replace(new RegExp('&', 'g'), '^&');
    return `"${id3UtilityFilePath}" "${escapedJsonText}"`;
  }
}
