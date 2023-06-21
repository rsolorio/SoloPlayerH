import { DataMappingEntity, DataSourceEntity } from "src/app/shared/entities";
import { IDataTransform } from "./data-transform.interface";
import { IFileInfo } from "src/app/platform/file/file.interface";
import { UtilityService } from "src/app/core/services/utility/utility.service";
import { IDataSourceInfo } from "../data-source/data-source.interface";
import { DataSourceType } from "../data-source/data-source.enum";
import { Id3v2SourceService } from "../data-source/id3v2-source.service";
import { MetaField } from "./data-transform.enum";
import { FileInfoSourceService } from "../data-source/file-info-source.service";
import { PathExpressionSourceService } from "../data-source/path-expression-source.service";
import { LogService } from "src/app/core/services/log/log.service";
import { KeyValues } from "src/app/core/models/core.interface";

export abstract class DataTransformServiceBase<T> implements IDataTransform {
  protected fields: MetaField[];
  protected sources: IDataSourceInfo[];
  protected mappingsByDestination: { [key: string]: DataMappingEntity[] };

  constructor(
    private utilityService: UtilityService,
    private logService: LogService,
    private id3v2SourceService: Id3v2SourceService,
    private fileInfoSourceService: FileInfoSourceService,
    private pathExpressionSourceService: PathExpressionSourceService
  ) {
  }

  protected abstract get profileId(): string;

  public abstract process(fileInfo: IFileInfo): Promise<T>;

  public async init(): Promise<void> {
    // Exclude fields that are not directly used by the transform tasks
    this.fields = Object.values(MetaField).filter(f => f !== MetaField.FileMode);

    this.sources = [];
    const sourceData = await DataSourceEntity.findBy({ profileId: this.profileId });
    this.utilityService.sort(sourceData, 'sequence').forEach(sourceRow => {
      if (!sourceRow.disabled) {
        const info = this.getDataSourceInfo(sourceRow);
        this.sources.push(info);
      }
    });
  }

  protected async getContext(fileInfo: IFileInfo): Promise<KeyValues> {
    // All values for a given destination will be saved in an array
    const context: KeyValues = {};
    for (const sourceInfo of this.sources) {
      if (sourceInfo && sourceInfo.data && sourceInfo.source) {
        const loadInfo = await sourceInfo.source.load({ filePath: fileInfo.path, config: sourceInfo.data.config, fieldArray: sourceInfo.fieldArray });
        if (loadInfo.error) {
          context[MetaField.Error] = [loadInfo.error];
          // TODO: continueOnError for other data sources
          return context;
        }
        if (sourceInfo.data.customMapping) {
          // TODO: custom mapping and tags
        }
        else {
          for (const field of sourceInfo.fieldArray) {
            if (!context[field]) {
              context[field] = [];
            }
            if (!context[field].length) {
              const values = await sourceInfo.source.get(field);
              if (values && values.length) {
                context[field] = values;
              }
            }
          }
        }
      }
      else {
        this.logService.warn('Data source info not found for id: ' + sourceInfo.data.id);
      }
    }
    return context;
  }

  protected getDataSourceInfo(dataSource: DataSourceEntity): IDataSourceInfo {
    const result: IDataSourceInfo = {
      data: dataSource,
      fieldArray: dataSource.fields.split(','),
      source: null
    };
    switch (dataSource.type) {
      case DataSourceType.Id3v2:
        result.source = this.id3v2SourceService;
        break;
      case DataSourceType.FileInfo:
        result.source = this.fileInfoSourceService;
        break;
      case DataSourceType.PathExpression:
        result.source = this.pathExpressionSourceService;
        break;
    }
    return result;
  }
}