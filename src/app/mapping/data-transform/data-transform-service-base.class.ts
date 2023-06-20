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
  protected sources: DataSourceEntity[];
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
    this.sources = await DataSourceEntity.findBy({ profileId: this.profileId });
    this.sources = this.utilityService.sort(this.sources, 'sequence');
  }

  protected async getContext(fileInfo: IFileInfo): Promise<KeyValues> {
    // All values for a given destination will be saved in an array
    const context: KeyValues = {};
    for (const source of this.sources) {
      const sourceInfo = this.getDataSourceInfo(source.id);
      if (sourceInfo && sourceInfo.data && sourceInfo.source) {
        const loadInfo = await sourceInfo.source.load({ filePath: fileInfo.path, config: sourceInfo.data.config });
        if (loadInfo.error) {
          context[MetaField.Error] = [loadInfo.error];
          // TODO: continueOnError for other data sources
          return context;
        }
        if (source.customMapping) {
          // TODO: custom mapping and tags
        }
        else {
          for (const field of this.fields) {
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
        this.logService.warn('Data source info not found for id: ' + source.id);
      }
    }
    return context;
  }

  protected getDataSourceInfo(dataSourceId: string): IDataSourceInfo {
    const dataSourceData = this.sources.find(source => source.id === dataSourceId);
    const result: IDataSourceInfo = {
      data: dataSourceData,
      source: null
    };
    if (dataSourceData) {
      switch (dataSourceData.type) {
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
    }
    return result;
  }
}