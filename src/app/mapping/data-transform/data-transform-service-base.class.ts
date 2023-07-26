import { DataSourceEntity } from "src/app/shared/entities";
import { IDataTransform, IDataTransformConfig } from "./data-transform.interface";
import { IFileInfo } from "src/app/platform/file/file.interface";
import { UtilityService } from "src/app/core/services/utility/utility.service";
import { IDataSource, IDataSourceInfo } from "../data-source/data-source.interface";
import { DataSourceType } from "../data-source/data-source.enum";
import { Id3v2SourceService } from "../data-source/id3v2-source.service";
import { MetaField } from "./data-transform.enum";
import { FileInfoSourceService } from "../data-source/file-info-source.service";
import { PathExpressionSourceService } from "../data-source/path-expression-source.service";
import { LogService } from "src/app/core/services/log/log.service";
import { KeyValues } from "src/app/core/models/core.interface";

export abstract class DataTransformServiceBase<T> implements IDataTransform {
  protected sources: IDataSourceInfo[];

  constructor(
    private utilityService: UtilityService,
    private logService: LogService,
    private id3v2SourceService: Id3v2SourceService,
    private fileInfoSourceService: FileInfoSourceService,
    private pathExpressionSourceService: PathExpressionSourceService)
  { }

  public abstract process(fileInfo: IFileInfo): Promise<T>;

  public async init(config: IDataTransformConfig): Promise<void> {
    this.sources = [];
    const sourceData = await DataSourceEntity.findBy({ profileId: config.profileId });
    this.utilityService.sort(sourceData, 'sequence').forEach(sourceRow => {
      if (!sourceRow.disabled) {
        const info = this.getDataSourceInfo(sourceRow, config?.dynamicFields);
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
        if (sourceInfo.data.customMapping && sourceInfo.mappings && sourceInfo.mappings.length) {
          // TODO: custom mapping and tags
        }
        else {
          await this.setValues(context, sourceInfo.source, sourceInfo.fieldArray);
          await this.setValues(context, sourceInfo.source, sourceInfo.dynamicFieldArray, true);
        }
      }
      else {
        this.logService.warn('Data source info not found for id: ' + sourceInfo.data.id);
      }
    }
    return context;
  }

  protected async setValues(context: KeyValues, dataSource: IDataSource, fields: string[], isDynamic?: boolean): Promise<void> {
    if (!fields || !fields.length) {
      return;
    }
    for (const field of fields) {
      if (!context[field]) {
        context[field] = [];
      }
      if (!context[field].length) {
        const values = await dataSource.get(field, isDynamic);
        if (values && values.length) {
          context[field] = values;
        }
      }
    }
  }

  protected getDataSourceInfo(dataSource: DataSourceEntity, dynamicFields?: string[]): IDataSourceInfo {
    const result: IDataSourceInfo = {
      data: dataSource,
      fieldArray: dataSource.fields.split(','),
      source: null
    };
    switch (dataSource.type) {
      case DataSourceType.Id3v2:
        result.source = this.id3v2SourceService;
        // Only id3 supports dynamic fields for now
        result.dynamicFieldArray = dynamicFields;
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