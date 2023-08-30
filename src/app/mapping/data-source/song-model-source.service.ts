import { Injectable } from '@angular/core';
import { IDataSourceParsed, IDataSourceService } from './data-source.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { MetaField } from '../data-transform/data-transform.enum';
import { DataMappingEntity } from 'src/app/shared/entities';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class SongModelSourceService implements IDataSourceService {
  private inputData: ISongModel;
  private entityData: IDataSourceParsed;
  constructor(private utility: UtilityService) { }

  public async init(input: ISongModel, entity: IDataSourceParsed): Promise<IDataSourceParsed> {
    if (this.inputData && this.inputData.filePath === input.filePath) {
      return entity;
    }
    this.inputData = input;
    this.entityData = entity;
    return entity;
  }

  public async get(propertyName: string): Promise<any[]> {
    const mappings = this.getMappings(propertyName);
    switch (propertyName) {
      case MetaField.TrackNumber:
        return [this.inputData.trackNumber];
      case MetaField.MediaNumber:
        return [this.inputData.mediaNumber];
      case MetaField.Year:
        return [this.inputData.releaseYear];
      case MetaField.Genre: // List of genres
        return [];
      case MetaField.UnSyncLyrics:
        return [this.inputData.lyrics];
      case MetaField.Album:
        return [this.inputData.primaryAlbumName];
      case MetaField.Artist: // List of artists, the first one is the primary
        return [this.inputData.primaryArtistName];
      case MetaField.ArtistStylized:
        return [this.inputData.primaryArtistStylized];
      case MetaField.UfId:
        return [this.inputData.id];
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
        if (mappings?.length) {

        }
        return [this.inputData[propertyName]];
    }
    return [];
  }

  private getMappings(destinationField: string): DataMappingEntity[] {
    const mappings = this.entityData.mappings.filter(m => m.destination === destinationField && !m.disabled);
    return this.utility.sort(mappings, 'sequence');
  }

  private getDataFromMappings(propertyName: string): any[] {
    const mappings = this.getMappings(propertyName);
    if (mappings?.length) {
      
    }
    return [];
  }
}
