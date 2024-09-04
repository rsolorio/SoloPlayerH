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
  private songIdCache: string;
  private classificationsCache: SongClassificationEntity[] = [];
  /**
   * A mapping object that defines the name of the placeholders that can be used
   * for the mapping scripts. This is a way to use easier/shorter names instead of the
   * real names of the source (in this case the ISongExtendedModel).
   */
  private placeholders: KeyValueGen<string> = {
    artist: 'primaryArtistName',
    album: 'primaryAlbumName',
    year: 'releaseYear',
    decade: 'releaseDecade',
    media: 'mediaNumber',
    track: 'trackNumber',
    title: 'name',
    ext: 'fileExtension',
    file: 'fileName',
    albumType: 'primaryAlbumType',
    artistType: 'primaryArtistType',
    cleanTitle: 'cleanName'
  };
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
      case MetaField.Description:
        return [this.inputData.primaryAlbumDescription];
      case MetaField.AlbumStylized:
        return [this.inputData.primaryAlbumStylized];
      case MetaField.AlbumSort:
        return [this.inputData.primaryAlbumSort];
      case MetaField.AlbumType:
        return [this.inputData.primaryAlbumType];
      case MetaField.Publisher:
        return [this.inputData.primaryAlbumPublisher];
      case MetaField.AlbumArtist:
        return [this.inputData.primaryArtistName];
      case MetaField.AlbumArtistSort:
        return [this.inputData.primaryArtistSort];
      case MetaField.AlbumArtistStylized:
        return [this.inputData.primaryArtistStylized];
      case MetaField.Artist:
        return this.getArtists();
      case MetaField.ArtistStylized:
        return this.getStylizedArtists(this.inputData);
      case MetaField.UfId:
        return [this.inputData.id];
      case MetaField.AlbumImage:
        return await this.getRelatedImagePath(this.inputData.primaryAlbumId, MusicImageType.Front);
      case MetaField.AlbumSecondaryImage:
        return await this.getRelatedImagePath(this.inputData.primaryAlbumId, MusicImageType.FrontAlternate);
      case MetaField.SingleImage:
        return await this.getRelatedImagePath(this.inputData.id, MusicImageType.Single);
      case MetaField.AlbumArtistImage:
        return await this.getRelatedImagePath(this.inputData.primaryArtistId, MusicImageType.AlbumArtist);
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
      case MetaField.MediaSubtitle:
        return [this.inputData[propertyName]];
    }
    return [];
  }

  /**
   * Gets mappings associated with the specified field and sorted by priority.
   */
  private getMappings(destinationField: string): DataMappingEntity[] {
    const mappings = this.entityData.mappings.filter(m => m.destination === destinationField && !m.disabled);
    return this.utility.sort(mappings, 'priority');
  }

  private async getDataFromMappings(associatedMappings: DataMappingEntity[]): Promise<any[]> {
    // Mappings will be grouped and sorted by priority
    const groupedMappings = this.utility.groupByKey(associatedMappings, 'priority');
    const groupKeys = Object.keys(groupedMappings);
    // If there are no results in a given priority we will move to the next priority to get results, and so on
    for (const groupKey of groupKeys) {
      const result: any[] = [];
      const groupMappings = groupedMappings[groupKey];
      // Within a priority group, the mappings should be processed ordered by sequence
      const sortedMappings = this.utility.sort(groupMappings, 'sequence');
      for (const mapping of sortedMappings) {
        if (mapping.iterator) {
          const data = await this.getDataFromExpression(mapping.iterator, this.placeholders);
          if (Array.isArray(data)) {
            const array = data as any[];
            for (const item of array) {
              // Add the data item as one more property to the context as %item%
              this.context.item = item;
              const value = await this.getDataFromExpression(mapping.source, this.placeholders);
              this.addValueToArray(result, value);
            }
            // Remove the data item from the context
            delete this.context.item;
          }
        }
        else {
          const value = await this.getDataFromExpression(mapping.source, this.placeholders);
          this.addValueToArray(result, value);
        }
      }
      if (result.length) {
        // Stop iterating groups and return the result
        return result;
      }
    }
    return [];
  }

  private async getDataFromExpression(expression: string, predefinedMappings: KeyValueGen<string>): Promise<any> {
    let result: any = null;
    // Hack to implement custom functions
    // These functions are supported alone and not combined with any other expression
    switch (expression) {
      case '$getSingleImage()':
        const singleImagePaths = await this.getRelatedImagePath(this.inputData.id, MusicImageType.Single);
        if (singleImagePaths?.length) {
          result = singleImagePaths[0];
        }
        break;
      case '$getAlbumImage()':
        const albumImagePaths = await this.getRelatedImagePath(this.inputData.primaryAlbumId, MusicImageType.Front);
        if (albumImagePaths?.length) {
          result = albumImagePaths[0];
        }
        break;
      case '$getGenres()':
        const genres = await this.getClassifications(this.inputData.id, ValueLists.Genre.id);
        if (genres?.length) {
          result = genres;
        }
        break;
      case '$getSubGenres()':
        const subGenres = await this.getClassifications(this.inputData.id, ValueLists.Subgenre.id);
        if (subGenres?.length) {
          result = subGenres;
        }
        break;
      case '$getCategories()':
        const categories = await this.getClassifications(this.inputData.id, ValueLists.Category.id);
        if (categories?.length) {
          result = categories;
        }
        break;
      case '$getOccasions()':
        const occasions = await this.getClassifications(this.inputData.id, ValueLists.Occasion.id);
        if (occasions?.length) {
          result = occasions;
        }
        break;
      case '$getInstruments()':
        const instruments = await this.getClassifications(this.inputData.id, ValueLists.Instrument.id);
        if (instruments?.length) {
          result = instruments;
        }
        break;
      case '$getTechInfo()':
        result = [this.inputData.fileExtension.toUpperCase(), this.getQuality(this.inputData)];
        break;
      case '$getStylizedArtists()':
        result = this.getStylizedArtists(this.inputData);
        break;
      default:
        result = this.parser.parse({
          expression: expression,
          context: this.context,
          mappings: predefinedMappings
        });
        break;
    }
    return result;
  }

  private addValueToArray(array: any[], value: any): void {
    if (value) {
      if (Array.isArray(value)) {
        array.push(...value);
      }
      else {
        array.push(value);
      }
    }
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

  private getArtists(): string[] {
    const result: string[] = [];

    // First, the album artist as regular artist
    result.push(this.inputData.primaryArtistName);
    // Find other artists (featuring) associated with the song
    const songRelations = this.syncProfileData.nonPrimaryRelations.filter(r => r.songId === this.inputData.id);
    for (const relation of songRelations) {
      if (!result.includes(relation.artistName)) {
        result.push(relation.artistName);
      }
    }
    // Then find artists (contributors and singers) associated with primary artist of the song
    const artistRelations = this.syncProfileData.nonPrimaryRelations.filter(r => r.artistId === this.inputData.primaryArtistId);
    for (const relation of artistRelations) {
      if (!result.includes(relation.artistName)) {
        result.push(relation.artistName);
      }
    }

    return result;
  }

  private getStylizedArtists(songData: ISongExtendedModel): string[] {
    const result: string[] = [];

    // First, the album artist as regular artist
    result.push(songData.primaryArtistStylized);
    // Find other artists (featuring) associated with the song
    const songRelations = this.syncProfileData.nonPrimaryRelations.filter(r => r.songId === songData.id);
    for (const relation of songRelations) {
      if (!result.includes(relation.artistStylized)) {
        result.push(relation.artistStylized);
      }
    }
    // Then find artists (contributors and singers) associated with primary artist of the song
    const artistRelations = this.syncProfileData.nonPrimaryRelations.filter(r => r.artistId === songData.primaryArtistId);
    for (const relation of artistRelations) {
      if (!result.includes(relation.artistStylized)) {
        result.push(relation.artistStylized);
      }
    }

    return result;
  }

  private async getClassifications(songId: string, classificationTypeId: string): Promise<string[]> {
    await this.cacheClassifications(songId);
    const result: string[] = [];
    const classifications = this.classificationsCache.filter(c => c.classificationTypeId === classificationTypeId);
    for (const classification of classifications) {
      const classificationInfo = this.syncProfileData.classifications.find(c => c.id === classification.classificationId);
      result.push(classificationInfo.name);
    }
    return result;
  }

  private async cacheClassifications(songId: string): Promise<void> {
    if (this.songIdCache !== songId) {
      this.classificationsCache = await SongClassificationEntity.findBy({ songId: songId });
      this.songIdCache = songId;
    }
  }

  private async getRelatedImagePath(songId: string, imageType: MusicImageType): Promise<string[]> {
    const relatedImage = await RelatedImageEntity.findOneBy({ relatedId: songId, imageType: imageType, sourceType: MusicImageSourceType.ImageFile });
    if (relatedImage?.sourcePath) {
      return [relatedImage.sourcePath];
    }
    return [];
  }

  /**
   * Supported values: GQ (good quality = 320kbps), VBR (variable bitrate), LQ (low quality = everything else)
   */
  private getQuality(songData: ISongExtendedModel): string {
    if (songData.vbr) {
      return 'VBR';
    }
    if (songData.bitrate === 320000) {
      return 'GQ';
    }
    return 'LQ';
  }
}
