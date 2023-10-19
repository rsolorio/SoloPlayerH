import { Injectable } from '@angular/core';
import { IDataSourceParsed, IDataSourceService } from './data-source.interface';
import { ISongExtendedModel } from 'src/app/shared/models/song-model.interface';
import { MetaField } from '../data-transform/data-transform.enum';
import { DataMappingEntity, RelatedImageEntity, SongClassificationEntity } from 'src/app/shared/entities';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ScriptParserService } from 'src/app/scripting/script-parser/script-parser.service';
import { KeyValueGen } from 'src/app/core/models/core.interface';
import { ISyncProfileParsed } from 'src/app/shared/models/sync-profile-model.interface';
import { ValueLists } from 'src/app/shared/services/database/database.lists';
import { MusicImageSourceType, MusicImageType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { appName } from 'src/app/app-exports';

/**
 * A data source that retrieves information from a ISongModel object.
 * It has a hardcoded mapping to get the data from specific properties in the object, but it supports
 * mapping which means it can be configured to get the data using script expressions.
 */
@Injectable({
  providedIn: 'root'
})
export class SongModelSourceService implements IDataSourceService {
  private inputData: ISongExtendedModel;
  private entityData: IDataSourceParsed;
  private syncProfileData: ISyncProfileParsed;
  private context: any;
  private counter = 0;
  constructor(private utility: UtilityService, private parser: ScriptParserService) { }

  public init(): void {
    this.counter = 0;
  }

  public async setSource(input: ISongExtendedModel, entity: IDataSourceParsed, syncProfile?: ISyncProfileParsed): Promise<IDataSourceParsed> {
    this.counter++;
    if (this.inputData && this.inputData.filePath === input.filePath) {
      return entity;
    }
    this.inputData = input;
    this.entityData = entity;
    this.syncProfileData = syncProfile;
    this.context = this.getContext();
    return entity;
  }

  public hasData(): boolean {
    return true;
  }

  public async getData(propertyName: string): Promise<any[]> {
    const mappings = this.getMappings(propertyName);
    if (mappings?.length) {
      // Prefer user mappings over default mappings
      return this.getDataFromMappings(mappings);
    }
    switch (propertyName) {
      case MetaField.FileName:
        const parts = this.inputData.filePath.split('\\');
        const fileName = parts[parts.length - 1].replace('.' + this.inputData.fileExtension, '');
        return [fileName];
      case MetaField.TrackNumber:
        return [this.inputData.trackNumber];
      case MetaField.MediaNumber:
        return [this.inputData.mediaNumber];
      case MetaField.Year:
        return [this.inputData.releaseYear];
      case MetaField.Album:
        // TODO: get unique name
        return [this.inputData.primaryAlbumName];
      case MetaField.AlbumStylized:
        return [this.inputData.primaryAlbumStylized];
      case MetaField.AlbumSort:
        return [this.inputData.primaryAlbumSort];
      case MetaField.AlbumType:
        return [this.inputData.primaryAlbumType];
      case MetaField.AlbumArtist:
        return [this.inputData.primaryArtistName];
      case MetaField.AlbumArtistSort:
        return [this.inputData.primaryArtistSort];
      case MetaField.ArtistStylized:
        return [this.inputData.primaryArtistStylized];
      case MetaField.Artist:
        const artists: string[] = [];
        artists.push(this.inputData.primaryArtistName);
        // Find artists associated with songs using songId and featuring type
        const songRelations = this.syncProfileData.nonPrimaryRelations.filter(r => r.songId === this.inputData.id);
        for (const relation of songRelations) {
          if (!artists.includes(relation.artistName)) {
            artists.push(relation.artistName);
          }
        }
        // Then find artists associated with primary artist by using artistId and lead singer or contributor
        const artistRelations = this.syncProfileData.nonPrimaryRelations.filter(r => r.artistId === this.inputData.primaryArtistId);
        for (const relation of artistRelations) {
          if (!artists.includes(relation.artistName)) {
            artists.push(relation.artistName);
          }
        }
        return artists;
      case MetaField.UfId:
        return [this.inputData.id];
      case MetaField.AlbumImage:
        return await this.getRelatedImagePath(this.inputData.primaryAlbumId, MusicImageType.Front);
      case MetaField.AlbumSecondaryImage:
        return await this.getRelatedImagePath(this.inputData.primaryAlbumId, MusicImageType.FrontAlternate);
      case MetaField.SingleImage:
        return await this.getRelatedImagePath(this.inputData.id, MusicImageType.Single);
      case MetaField.AlbumArtistImage:
        return await this.getRelatedImagePath(this.inputData.primaryArtistId, MusicImageType.Artist);
      case MetaField.Title:
        return [this.inputData.name];
      case MetaField.CleanTitle:
        return [this.inputData.cleanName];
      case MetaField.ArtistType:
        return [this.inputData.primaryArtistType];
      case MetaField.UnSyncLyrics:
        // TODO: remove this property and implement a method to get this data
        return [this.inputData.lyrics];
      case MetaField.Owner:
        // TODO: a module option?
        return [appName];
      case MetaField.Genre:
        return this.getClassifications(this.inputData.id, ValueLists.Genre.id);
      case MetaField.Subgenre:
        return this.getClassifications(this.inputData.id, ValueLists.Subgenre.id);
      case MetaField.Category:
        return this.getClassifications(this.inputData.id, ValueLists.Category.id);
      case MetaField.Occasion:
        return this.getClassifications(this.inputData.id, ValueLists.Occasion.id);
      case MetaField.Instrument:
        return this.getClassifications(this.inputData.id, ValueLists.Instrument.id);
      case MetaField.Url:
        return [this.inputData.infoUrl];
      case MetaField.PlayHistory:
        return []; // ToDo
      case MetaField.Rating:
      case MetaField.PlayCount:
      case MetaField.PerformerCount:
      case MetaField.Mood:
      case MetaField.Language:
      case MetaField.Favorite:
      case MetaField.Live:
      case MetaField.Explicit:
      case MetaField.AddDate:
      case MetaField.ChangeDate:
      case MetaField.PlayDate:
      case MetaField.FilePath:
      case MetaField.Grouping:
      case MetaField.Composer:
      case MetaField.ComposerSort:
      case MetaField.OriginalArtist:
      case MetaField.OriginalAlbum:
      case MetaField.OriginalReleaseYear:
      case MetaField.TitleSort:
      case MetaField.Comment:
      case MetaField.Seconds:
      case MetaField.Tempo:
      case MetaField.ReplayGain:
      case MetaField.Country:
      case MetaField.Subtitle:
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

  private async getDataFromMappings(associatedMappings: DataMappingEntity[]): Promise<any[]> {
    const predefinedMappings = this.setupScriptingPlaceholders();
    const groupedMappings = this.utility.groupByKey(associatedMappings, 'sequence');
    // Mappings with the same sequence will be included in the same result
    // If there are no results in a given sequence we will move to the next sequence to get results, and so on
    const groupKeys = Object.keys(groupedMappings);
    for (const groupKey of groupKeys) {
      const result: any[] = [];
      const groupMappings = groupedMappings[groupKey];
      for (const mapping of groupMappings) {
        // Hack to implement custom functions
        switch (mapping.source) {
          case '$getSingleImage()':
            const singleImagePaths = await this.getRelatedImagePath(this.inputData.id, MusicImageType.Single);
            if (singleImagePaths?.length) {
              result.push(singleImagePaths[0]);
            }
            break;
          case '$getAlbumImage()':
            const albumImagePaths = await this.getRelatedImagePath(this.inputData.primaryAlbumId, MusicImageType.Front);
            if (albumImagePaths?.length) {
              result.push(albumImagePaths[0]);
            }
            break;
          default:
            const value = this.parser.parse({
              expression: mapping.source,
              context: this.context,
              mappings: predefinedMappings });
            result.push(value);
            break;
        }
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
   * real names of the source (in this case the ISongExtendedModel).
   */
  private setupScriptingPlaceholders(): KeyValueGen<string> {
    const result: KeyValueGen<string> = {};
    result['artist'] = 'primaryArtistName';
    result['album'] = 'primaryAlbumName';
    result['year'] = 'releaseYear';
    result['decade'] = 'releaseDecade';
    result['media'] = 'mediaNumber';
    result['track'] = 'trackNumber';
    result['title'] = 'name';
    result['ext'] = 'fileExtension';
    result['file'] = 'fileName';
    result['albumType'] = 'primaryAlbumType';
    result['artistType'] = 'primaryArtistType';
    return result;
  }

  /**
   * Extends the input data with more properties that can be used with the mapping scripts.
   */
  private getContext(): any {
    const context = Object.assign({}, this.inputData);
    // Destination path without the last backslash
    const destinationPath = this.syncProfileData.directoryArray[0];
    context['rootPath'] = destinationPath.endsWith('\\') ? destinationPath.slice(0, -1) : destinationPath;
    context['counter'] = this.counter;
    return context;
  }

  private async getClassifications(songId: string, classificationTypeId: string): Promise<string[]> {
    const result: string[] = [];
    const classifications = await SongClassificationEntity.findBy({ songId: songId, classificationTypeId: classificationTypeId });
    for (const classification of classifications) {
      const classificationInfo = this.syncProfileData.classifications.find(c => c.id === classification.classificationId);
      result.push(classificationInfo.name);
    }
    return result;
  }

  private async getRelatedImagePath(songId: string, imageType: MusicImageType): Promise<string[]> {
    const relatedImage = await RelatedImageEntity.findOneBy({ relatedId: songId, imageType: imageType, sourceType: MusicImageSourceType.ImageFile });
    if (relatedImage?.sourcePath) {
      return [relatedImage.sourcePath];
    }
    return [];
  }
}
