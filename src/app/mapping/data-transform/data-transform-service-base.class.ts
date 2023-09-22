import { IDataTransformService } from "./data-transform.interface";
import { IDataSourceService, IDataSourceParsed } from "../data-source/data-source.interface";
import { KeyValues } from "src/app/core/models/core.interface";
import { ISyncProfileParsed } from "src/app/shared/models/sync-profile-model.interface";
import { DatabaseEntitiesService } from "src/app/shared/services/database/database-entities.service";
import { MetaField } from "./data-transform.enum";

export abstract class DataTransformServiceBase<TProcessInput, TDataInput, TProcessOutput> implements IDataTransformService {
  protected syncProfile: ISyncProfileParsed;
  protected sources: IDataSourceParsed[];

  constructor(private entityService: DatabaseEntitiesService)
  { }

  public async init(profile: ISyncProfileParsed): Promise<void> {
    this.syncProfile = profile;
    this.sources = await this.entityService.getDataSources(profile.id);
    this.sources.forEach(source => {
      source.service = this.getService(source.type);
      if (source.service) {
        source.service.init();
      }
    });
  }

  public abstract run(input: TProcessInput): Promise<TProcessOutput>;

  /** Used to get data from the data sources using the specified input. */
  protected abstract getData(input: TDataInput): Promise<KeyValues>;

  protected abstract getService(dataSourceType: string): IDataSourceService;

  /**
   * Sets the value of the metadata based on the specified fields using the specified data source.
   */
  protected async setValuesAndMappings(metadata: KeyValues, dataSource: IDataSourceParsed): Promise<void> {
    if (!dataSource.service.hasData()) {
      return;
    }
    // Get values from each of the fields in the data source
    await this.setValues(metadata, dataSource.service, dataSource.fieldArray);
    // Now get values from the user defined fields
    if (dataSource.mappings?.length) {
      const userDefinedMappings = dataSource.mappings.filter(m => m.userDefined);
      if (userDefinedMappings.length) {
        // Setup the list of ud fields
        if (!metadata[MetaField.UserDefinedField]) {
          metadata[MetaField.UserDefinedField] = [];
        }
        const userDefinedFields = metadata[MetaField.UserDefinedField];
        for (const mapping of userDefinedMappings) {
          if (!userDefinedFields.includes(mapping.destination)) {
            userDefinedFields.push(mapping.destination);
          }
          if (!metadata[mapping.destination]) {
            metadata[mapping.destination] = await dataSource.service.getData(mapping.destination);
          }
        }
      }
    }
  }

  protected async setValues(metadata: KeyValues, service: IDataSourceService, fields: string[]) {
    if (!fields || !fields.length) {
      return;
    }
    // Get values from each of the fields in the data source
    for (const field of fields) {
      if (!metadata[field]) {
        metadata[field] = [];
      }
      if (!metadata[field].length) {
        const values = await service.getData(field);
        if (values && values.length) {
          metadata[field] = values;
        }
      }
    }
  }
}