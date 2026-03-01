import { Injectable } from '@angular/core';
import { IDataSourceParsed, IDataSourceService } from './data-source.interface';
import { ISongExtendedModel } from 'src/app/shared/models/song-model.interface';
import { MetaAttribute } from '../data-transform/data-transform.enum';
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
 * It has a hardcoded logic to get the data from specific properties in the object, but it supports
 * user mapping which means it can be configured to get the data using script expressions.
 * In other words, attribute data is retrieved either by:
 * - Processing a user mapping which contains an expression (hardcoded text and/or placeholders)
 * - Running hardcoded logic associated with the given attribute
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

  public async getData(attributeName: string): Promise<any[]> {
    const mappings = this.getMappings(attributeName);
    if (mappings?.length) {
      // Prefer user mappings over default mappings
      return this.getDataFromMappings(mappings);
    }
    switch (attributeName) {
      case MetaAttribute.FileName:
        const parts = this.inputData.filePath.split('\\');
        const fileName = parts[parts.length - 1].replace('.' + this.inputData.fileExtension, '');
        return [fileName];
      case MetaAttribute.TrackNumber:
        return [this.inputData.trackNumber];
      case MetaAttribute.MediaNumber:
        return [this.inputData.mediaNumber];
      case MetaAttribute.Year:
        return [this.inputData.releaseYear];
      case MetaAttribute.Album:
        // TODO: get unique name
        return [this.inputData.primaryAlbumName];
      case MetaAttribute.Description:
        return [this.inputData.primaryAlbumDescription];
      case MetaAttribute.AlbumStylized:
        return [this.inputData.primaryAlbumStylized];
      case MetaAttribute.AlbumSort:
        return [this.inputData.primaryAlbumSort];
      case MetaAttribute.AlbumType:
        return [this.inputData.primaryAlbumType];
      case MetaAttribute.Publisher:
        return [this.inputData.primaryAlbumPublisher];
      case MetaAttribute.AlbumArtist:
        return [this.inputData.primaryArtistName];
      case MetaAttribute.AlbumArtistSort:
        return [this.inputData.primaryArtistSort];
      case MetaAttribute.AlbumArtistStylized:
        return [this.inputData.primaryArtistStylized];
      case MetaAttribute.Artist:
        return this.getArtists();
      case MetaAttribute.ArtistStylized:
        return this.getStylizedArtists(this.inputData);
      case MetaAttribute.UfId:
        return [this.inputData.id];
      case MetaAttribute.AlbumImage:
        return await this.getRelatedImagePath(this.inputData.primaryAlbumId, MusicImageType.Front);
      case MetaAttribute.AlbumSecondaryImage:
        return await this.getRelatedImagePath(this.inputData.primaryAlbumId, MusicImageType.FrontAlternate);
      case MetaAttribute.SingleImage:
        return await this.getRelatedImagePath(this.inputData.id, MusicImageType.Single);
      case MetaAttribute.AlbumArtistImage:
        return await this.getRelatedImagePath(this.inputData.primaryArtistId, MusicImageType.AlbumArtist);
      case MetaAttribute.Title:
        return [this.inputData.name];
      case MetaAttribute.CleanTitle:
        return [this.inputData.cleanName];
      case MetaAttribute.ArtistType:
        return [this.inputData.primaryArtistType];
      case MetaAttribute.UnSyncLyrics:
        // TODO: remove this property and implement a method to get this data
        return [this.inputData.lyrics];
      case MetaAttribute.Owner:
        // TODO: a module option?
        return [appName];
      case MetaAttribute.Genre:
        return this.getClassifications(this.inputData.id, ValueLists.Genre.id);
      case MetaAttribute.Subgenre:
        return this.getClassifications(this.inputData.id, ValueLists.Subgenre.id);
      case MetaAttribute.Category:
        return this.getClassifications(this.inputData.id, ValueLists.Category.id);
      case MetaAttribute.Occasion:
        return this.getClassifications(this.inputData.id, ValueLists.Occasion.id);
      case MetaAttribute.Instrument:
        return this.getClassifications(this.inputData.id, ValueLists.Instrument.id);
      case MetaAttribute.Url:
        return [this.inputData.infoUrl];
      case MetaAttribute.PlayHistory:
        return []; // ToDo
      // All these attribute values match with an existing column name
      case MetaAttribute.Rating:
      case MetaAttribute.PlayCount:
      case MetaAttribute.PerformerCount:
      case MetaAttribute.Mood:
      case MetaAttribute.Language:
      case MetaAttribute.Favorite:
      case MetaAttribute.Live:
      case MetaAttribute.Advisory:
      case MetaAttribute.AddDate:
      case MetaAttribute.ChangeDate:
      case MetaAttribute.PlayDate:
      case MetaAttribute.FilePath:
      case MetaAttribute.Grouping:
      case MetaAttribute.Composer:
      case MetaAttribute.ComposerSort:
      case MetaAttribute.OriginalArtist:
      case MetaAttribute.OriginalAlbum:
      case MetaAttribute.OriginalReleaseYear:
      case MetaAttribute.TitleSort:
      case MetaAttribute.Comment:
      case MetaAttribute.Seconds:
      case MetaAttribute.Tempo:
      case MetaAttribute.ReplayGain:
      case MetaAttribute.Country:
      case MetaAttribute.Subtitle:
      case MetaAttribute.MediaSubtitle:
      case MetaAttribute.MusicBrainzTrackId:
        return [this.inputData[attributeName]];
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
    // This loop iterates each priority group
    // If there are no results in a given priority, it will move to the next priority to get results, and so on
    for (const groupKey of groupKeys) {
      const result: any[] = [];
      const groupMappings = groupedMappings[groupKey];
      // Within a priority group, the mappings should be processed ordered by sequence
      const sortedMappings = this.utility.sort(groupMappings, 'sequence');
      // This loop iterates each mapping within a given group
      for (const mapping of sortedMappings) {
        const valuesToIgnore = mapping.ignore ? mapping.ignore.split('|') : [];
        if (mapping.iterator) {
          const data = await this.getDataFromExpression(mapping.iterator, this.placeholders);
          if (Array.isArray(data)) {
            const array = data as any[];
            for (const item of array) {
              // Add the data item as one more property to the context as %item%
              this.context.item = item;
              const value = await this.getDataFromExpression(mapping.source, this.placeholders);
              this.addValueToArray(result, value, valuesToIgnore);
            }
            // Remove the data item from the context
            delete this.context.item;
          }
        }
        else {
          const value = await this.getDataFromExpression(mapping.source, this.placeholders);
          this.addValueToArray(result, value, valuesToIgnore);
        }
      }
      // If the iteration yielded at least one result stop here
      if (result.length) {
        return result;
      }
      // If not, continue the next priority group
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
      case '$getGenresDelimited()':
        const genres = await this.getClassifications(this.inputData.id, ValueLists.Genre.id);
        if (genres?.length) {
          result = expression === '$getGenres()' ? genres : genres.join('/')
        }
        break;
      case '$getSubGenres()':
      case '$getSubGenresDelimited()':
        const subGenres = await this.getClassifications(this.inputData.id, ValueLists.Subgenre.id);
        if (subGenres?.length) {
          result = expression === '$getSubGenres()' ? subGenres : subGenres.join('/');
        }
        break;
      case '$getCategories()':
      case '$getCategoriesDelimited()':
        const categories = await this.getClassifications(this.inputData.id, ValueLists.Category.id);
        if (categories?.length) {
          result = expression === '$getCategories()' ? categories : categories.join('/');
        }
        break;
      case '$getOccasions()':
      case '$getOccasionsDelimited()':
        const occasions = await this.getClassifications(this.inputData.id, ValueLists.Occasion.id);
        if (occasions?.length) {
          result = expression === '$getOccasions()' ? occasions : occasions.join('/');
        }
        break;
      case '$getInstruments()':
      case '$getInstrumentsDelimited()':
        const instruments = await this.getClassifications(this.inputData.id, ValueLists.Instrument.id);
        if (instruments?.length) {
          result = expression === '$getInstruments()' ? instruments : instruments.join('/');
        }
        break;
      case '$getTechInfo()':
        result = `${this.inputData.fileExtension.toUpperCase()}/${this.getQuality(this.inputData)}`;
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

  /** Helper function to a single value or an array of values to an existing array. */
  private addValueToArray(array: any[], value: any, ignoreArray: any[]): void {
    if (value) {
      const inputArray: any[] = [];
      if (Array.isArray(value)) {
        inputArray.push(...value);
      }
      else {
        inputArray.push(value);
      }

      for (const inputValue of inputArray) {
        if (!ignoreArray.includes(value)) {
          array.push(inputValue);
        }
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
