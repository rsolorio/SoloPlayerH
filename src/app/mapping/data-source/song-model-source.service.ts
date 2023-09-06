import { Injectable } from '@angular/core';
import { IDataSourceParsed, IDataSourceService } from './data-source.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { MetaField } from '../data-transform/data-transform.enum';
import { DataMappingEntity } from 'src/app/shared/entities';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ScriptParserService } from 'src/app/scripting/script-parser/script-parser.service';
import { KeyValueGen } from 'src/app/core/models/core.interface';
import { ISyncProfileParsed } from 'src/app/shared/models/sync-profile-model.interface';

/**
 * A data source that retrieves information from a ISongModel object.
 * It has a hardcoded mapping to get the data from specific properties in the object, but it supports
 * mapping which means it can be configured to get the data using script expressions.
 */
@Injectable({
  providedIn: 'root'
})
export class SongModelSourceService implements IDataSourceService {
  private inputData: ISongModel;
  private entityData: IDataSourceParsed;
  private syncProfileData: ISyncProfileParsed;
  private context: any;
  constructor(private utility: UtilityService, private parser: ScriptParserService) { }

  public async init(input: ISongModel, entity: IDataSourceParsed, syncProfile?: ISyncProfileParsed): Promise<IDataSourceParsed> {
    if (this.inputData && this.inputData.filePath === input.filePath) {
      return entity;
    }
    this.inputData = input;
    this.entityData = entity;
    this.syncProfileData = syncProfile;
    this.context = this.getContext();
    return entity;
  }

  public async get(propertyName: string): Promise<any[]> {
    const mappings = this.getMappings(propertyName);
    if (mappings?.length) {
      return this.getDataFromMappings(mappings);
    }
    switch (propertyName) {
      case MetaField.TrackNumber:
        return [this.inputData.trackNumber];
      case MetaField.MediaNumber:
        return [this.inputData.mediaNumber];
      case MetaField.Year:
        return [this.inputData.releaseYear];
      case MetaField.Genre: // List of genres
        return [this.inputData.genre];
      case MetaField.UnSyncLyrics:
        return [this.inputData.lyrics];
      case MetaField.Album:
        // TODO: get unique name
        return [this.inputData.primaryAlbumName];
      case MetaField.AlbumSort:
        return []; // Not in song view
      case MetaField.AlbumArtist:
        return [this.inputData.primaryArtistName];
      case MetaField.ArtistStylized:
        return [this.inputData.primaryArtistStylized];
      case MetaField.Artist:
        return []; // List of artists, the first one is the primary
      case MetaField.UfId:
        return [this.inputData.id];
      case MetaField.Composer:
        return []; // Not in song view
      case MetaField.ComposerSort:
        return []; // Not in song view
      case MetaField.AlbumImage:
      case MetaField.AlbumSecondaryImage:
      case MetaField.SingleImage:
      case MetaField.AlbumArtistImage:
      case MetaField.OtherImage:
        return []; // Not in song view
      case MetaField.Title:
        return [this.inputData.name];
      case MetaField.TitleSort:
        return []; // Not in song view
      case MetaField.ArtistType:
        return []; // Not in song view
      case MetaField.Grouping:
        return []; // Not in song view
      case MetaField.ChangeDate:
        return []; // Not in song view
      case MetaField.UnSyncLyrics:
        // TODO: remove this property and implement a method to get this data
        return [this.inputData.lyrics];
      case MetaField.Owner:
        return []; // Not saved in the db
      case MetaField.Subgenre:
      case MetaField.Category:
      case MetaField.Occasion:
      case MetaField.Instrument:
        return []; // Special case for these fields.
      case MetaField.Rating:
      case MetaField.PlayCount:
      case MetaField.Performers:
      case MetaField.Mood:
      case MetaField.Language:
      case MetaField.Favorite:
      case MetaField.Live:
      case MetaField.Explicit:
      case MetaField.AddDate:
      case MetaField.FilePath:
        return [this.inputData[propertyName]];
    }
    return [];
  }

  /**
   * Gets mappings associated with the specified field and sorted by sequence.
   */
  private getMappings(destinationField: string): DataMappingEntity[] {
    const mappings = this.entityData.mappings.filter(m => m.destination === destinationField && !m.disabled);
    return this.utility.sort(mappings, 'sequence');
  }

  private getDataFromMappings(associatedMappings: DataMappingEntity[]): any[] {
    const groupedMappings = this.utility.groupByKey(associatedMappings, 'sequence');
    // Mappings with the same sequence will be included in the same result
    // If there are no results in a given sequence we will move to the next sequence to get results, and so on
    const groupKeys = Object.keys(groupedMappings);
    for (const groupKey of groupKeys) {
      const result: any[] = [];
      const groupMappings = groupedMappings[groupKey];
      for (const mapping of groupMappings) {
        const value = this.parser.parse({
          expression: mapping.source,
          context: this.context,
          mappings: this.setupScriptingPlaceholders() });
        result.push(value);
      }
      if (result.length) {
        // Stop iterating groups and return the result
        return result;
      }
    }
    return [];
  }

  /**
   * Prepares a mapping object that defines the name of the placeholders that can be used
   * for the mapping scripts. This is a way to use easier/shorter names instead of the 
   * real names of the source (in this case the ISongModel).
   */
  private setupScriptingPlaceholders(): KeyValueGen<string> {
    const result: KeyValueGen<string> = {};
    result['artist'] = 'primaryArtistName';
    result['album'] = 'primaryAlbumName';
    result['year'] = 'releaseYear';
    result['media'] = 'mediaNumber';
    result['track'] = 'trackNumber';
    result['title'] = 'name';
    return result;
  }

  /**
   * Extends the input data with more properties that can be used with the mapping scripts.
   */
  private getContext(): any {
    const context = Object.assign({}, this.inputData);
    // Extension without the dot
    context['extension'] = this.inputData.filePath.substring(this.inputData.filePath.lastIndexOf('.') + 1);
    // Destination path without the last backslash
    const destinationPath = this.syncProfileData.directories[0];
    context['rootPath'] = destinationPath.endsWith('\\') ? destinationPath.slice(0, -1) : destinationPath;
    return context;
  }
}
