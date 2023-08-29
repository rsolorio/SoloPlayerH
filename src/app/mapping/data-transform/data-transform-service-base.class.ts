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

  public abstract process(input: TInput): Promise<TOutput>;

  public async init(profile: ISyncProfileParsed): Promise<void> {
    this.syncProfile = profile;
    this.sources = await this.entityService.getDataSources(profile.id);
    this.sources.forEach(source => {
      source.service = this.getService(source.type);
    });
  }

  protected abstract getData(input: TInput): Promise<KeyValues>;

  protected abstract getService(dataSourceType: string): IDataSourceService;
}