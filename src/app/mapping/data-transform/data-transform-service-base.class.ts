import { IDataTransformService } from "./data-transform.interface";
import { IDataSourceService, IDataSourceParsed } from "../data-source/data-source.interface";
import { KeyValues } from "src/app/core/models/core.interface";
import { ISyncProfileParsed } from "src/app/shared/models/sync-profile-model.interface";
import { DatabaseEntitiesService } from "src/app/shared/services/database/database-entities.service";

export abstract class DataTransformServiceBase<TInput, TOutput> implements IDataTransformService {
  protected syncProfile: ISyncProfileParsed;
  protected sources: IDataSourceParsed[];

  constructor(private entityService: DatabaseEntitiesService)
  { }

  public async init(profile: ISyncProfileParsed): Promise<void> {
    this.syncProfile = profile;
    this.sources = await this.entityService.getDataSources(profile.id);
    this.sources.forEach(source => {
      source.service = this.getService(source.type);
    });
  }

  public abstract process(input: TInput): Promise<TOutput>;

  protected abstract getData(input: TInput): Promise<KeyValues>;

  protected abstract getService(dataSourceType: string): IDataSourceService;

  /**
   * Sets the value of the metadata based on the specified fields using the specified data source.
   */
  protected async setValues(metadata: KeyValues, dataSource: IDataSourceService, fields: string[]): Promise<void> {
    if (!fields || !fields.length || !dataSource.hasData()) {
      return;
    }
    for (const field of fields) {
      if (!metadata[field]) {
        metadata[field] = [];
      }
      if (!metadata[field].length) {
        const values = await dataSource.get(field);
        if (values && values.length) {
          metadata[field] = values;
        }
      }
    }
  }
}