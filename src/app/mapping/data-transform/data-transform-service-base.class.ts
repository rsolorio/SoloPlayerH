import { DataMappingEntity, DataSourceEntity } from "src/app/shared/entities";
import { IDataTransform } from "./data-transform.interface";
import { IFileInfo } from "src/app/platform/file/file.interface";
import { UtilityService } from "src/app/core/services/utility/utility.service";
import { IDataSourceInfo } from "../data-source/data-source.interface";
import { DataSourceType } from "../data-source/data-source.enum";
import { Id3v2SourceService } from "../data-source/id3v2-source.service";
import { OutputField } from "./data-transform.enum";
import { inject } from "@angular/core";
import { FileInfoSourceService } from "../data-source/file-info-source.service";
import { PathExpressionSourceService } from "../data-source/path-expression-source.service";
import { LogService } from "src/app/core/services/log/log.service";
import { KeyValues } from "src/app/core/models/core.interface";

export abstract class DataTransformServiceBase<T> implements IDataTransform {
  protected sources: DataSourceEntity[];
  protected mappingsByDestination: { [key: string]: DataMappingEntity[] };

  constructor(private utilityService: UtilityService, private logService: LogService) {
  }

  protected abstract get profileId(): string;

  public abstract process(fileInfo: IFileInfo): Promise<T>;

  public async init(): Promise<void> {
    this.sources = await DataSourceEntity.findBy({ profileId: this.profileId });
    this.sources = this.utilityService.sort(this.sources, 'sequence');
  }

  protected async getContext(fileInfo: IFileInfo): Promise<KeyValues> {
    // All values for a given destination will be saved in an array
    const context: KeyValues = {};
    for (const source of this.sources) {
      const sourceInfo = this.getDataSourceInfo(source.id);
      if (sourceInfo && sourceInfo.data && sourceInfo.source) {
        await sourceInfo.source.load({ filePath: fileInfo.path, config: sourceInfo.data.config });
        if (source.customMapping) {
          // TODO: custom mapping and tags
        }
        else {
          const fields = Object.values(OutputField);
          for (const field of fields) {
            if (!context[field]) {
              context[field] = [];
            }
            if (!context[field].length) {
              const values = sourceInfo.source.get(field);
              if (values && values.length) {
                context[field] = values;
              }
            }
          }
        }
      }
      else {
        this.logService.warn('Data source info not found for id: ' + source.id);
      }
    }
    return context;
  }

  // protected async getContext(fileInfo: IFileInfo): Promise<{ [key: string]: any[] }> {
  //   const context: { [key: string]: any[] } = {};
  //   for (const destination of Object.keys(this.mappingsByDestination)) {
  //     // All values for a given destination will be saved in an array
  //     context[destination] = [];
  //     const sortedMappings = this.utilityService.sort(this.mappingsByDestination[destination], 'sequence');
  //     const mappingsBySequence = this.utilityService.groupByKey(sortedMappings, 'sequence');
  //     for (const sequence of Object.keys(mappingsBySequence)) {
  //       // These are all the mappings for a given destination and sequence
  //       const mappings = mappingsBySequence[sequence];
  //       // All these mappings will be processed if the destination has no values yet
  //       if (!context[destination].length) {
  //         // All mappings in this sequence will go to an array
  //         for (const mapping of mappings) {
  //           const info = this.getDataSourceInfo(mapping.dataSourceId);
  //           if (info && info.data && info.source) {
  //             await info.source.load({ filePath: fileInfo.path, config: info.data.config });
  //             const value = info.source.get(mapping.source);
  //             if (value) {
  //               context[destination].push(value);
  //             }
  //           }
  //           else {
  //             this.logService.warn('Data source info not found for id: ' + mapping.dataSourceId);
  //           }
  //         }
  //       }        
  //     }
  //   }
  //   return context;
  // }

  protected getDataSourceInfo(dataSourceId: string): IDataSourceInfo {
    const dataSourceData = this.sources.find(source => source.id = dataSourceId);
    const result: IDataSourceInfo = {
      data: dataSourceData,
      source: null
    };
    if (dataSourceData) {
      switch (dataSourceData.type) {
        case DataSourceType.Id3v2:
          result.source = inject(Id3v2SourceService);
          break;
        case DataSourceType.FileInfo:
          result.source = inject(FileInfoSourceService);
          break;
        case DataSourceType.PathExpression:
          result.source = inject(PathExpressionSourceService);
          break;
      }
    }
    return result;
  }
}