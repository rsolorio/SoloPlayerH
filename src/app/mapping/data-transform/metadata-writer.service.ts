import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { IDataSourceService } from '../data-source/data-source.interface';
import { KeyValues } from 'src/app/core/models/core.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { DataSourceType } from '../data-source/data-source.enum';
import { SongModelSourceService } from '../data-source/song-model-source.service';
import { FileService } from 'src/app/platform/file/file.service';
import { MetaField } from './data-transform.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

/**
 * A transform service to save metadata to an audio file.
 * It uses the specified profile to get a list of data sources;
 * data sources have the responsibility of reading metadata and pass it to the writer.
 * Data sources support custom mapping.
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataWriterService extends DataTransformServiceBase<ISongModel, any> {

  constructor(
    private fileService: FileService,
    private utility: UtilityService,
    private entities: DatabaseEntitiesService,
    private songModelSource: SongModelSourceService) {
    super(entities);
  }

  public async process(input: ISongModel): Promise<any> {
    // 1. Get the metadata
    const metadata = await this.getData(input);
    // 2. Create the file
    const filePath = this.first(metadata[MetaField.FilePath]);
    await this.fileService.copyFile(input.filePath, filePath);
    // 3. Write metadata
    await this.writeMetadata(metadata);
    // TODO: this should return a log of the file save process
    return metadata;
  }

  protected async getData(input: ISongModel): Promise<KeyValues> {
    const result: KeyValues = {};
    for (const source of this.sources) {
      if (source.service) {
        const initResult = await source.service.init(input, source, this.syncProfile);
        if (!initResult.error) {
          await this.setValues(result, source.service, source.fieldArray);
        }
      }
    }
    return result;
  }

  protected getService(dataSourceType: string): IDataSourceService {
    switch(dataSourceType) {
      case DataSourceType.SongModel:
        return this.songModelSource;
      default:
        return null;
    }
  }

  private async writeMetadata(metadata: KeyValues): Promise<void> {
    // For now I'm relying the metadata write mechanism on a .net tool I built myself using TagLibSharp
    // since I did not find a package that supports writing Id3v2.4 tags with multiple artists and genres.
    await this.fileService.runCommand(this.createCommand(metadata));
  }

  private createCommand(metadata: KeyValues): string {
    const id3UtilityFilePath = 'F:\\Code\\VS Online\\SoloSoft\\Bin46\\Id3Command.exe';
    const jsonText = JSON.stringify(metadata);
    // We don't need to escape single backslashes since they are escaped when the object is stringified
    const escapedJsonText = jsonText.replace(new RegExp('"', 'g'), '\\"');
    return `"${id3UtilityFilePath}" "${escapedJsonText}"`;
  }

  // For now I decided not to use node-id3 since it does not support writing to Id3v2.4,
  // especially for writing multiple artists and genres.
  // private createTags(metadata: KeyValues): any {
  //   const tags: NodeId3.Tags = {};

  //   const title = this.first(metadata[MetaField.Title]);
  //   if (title) {
  //     tags.title = title;
  //   }

  //   const titleSort = this.first(metadata[MetaField.TitleSort]);
  //   if (titleSort) {
  //     tags.titleSortOrder = titleSort;
  //   }

  //   const subtitle = this.first(metadata[MetaField.SubTitle]);
  //   if (subtitle) {
  //     tags.subtitle = subtitle;
  //   }

  //   const artists = metadata[MetaField.Artist];
  //   if (artists?.length) {
  //     tags.artist = artists.join('/');
  //   }

  //   const albumArtist = this.first(metadata[MetaField.AlbumArtist]);
  //   if (albumArtist) {
  //     tags.performerInfo = albumArtist;
  //   }

  //   const albumArtistSort = this.first(metadata[MetaField.AlbumArtistSort]);
  //   if (albumArtistSort) {
  //     tags.performerSortOrder = albumArtistSort;
  //   }

  //   const album = this.first(metadata[MetaField.Album]);
  //   if (album) {
  //     tags.album = album;
  //   }

  //   const albumSort = this.first(metadata[MetaField.AlbumSort]);
  //   if (albumSort) {
  //     tags.albumSortOrder = albumSort;
  //   }

  //   const genres = metadata[MetaField.Genre];
  //   if (genres?.length) {
  //     genres.push('Test genre');
  //     //tags.genre = genres.join('\\\\');
  //     tags['TCON'] = genres;
  //   }

  //   const track = this.first(metadata[MetaField.TrackNumber]);
  //   if (track) {
  //     tags.trackNumber = track;
  //   }

  //   const media = this.first(metadata[MetaField.MediaNumber]);
  //   if (media) {
  //     tags.partOfSet = media;
  //   }

  //   const year = this.first(metadata[MetaField.Year]);
  //   if (year) {
  //     tags.year = year; // TYER
  //   }

  //   const comment = this.first(metadata[MetaField.Comment]);
  //   if (comment) {
  //     tags.comment = comment;
  //   }

  //   const composer = this.first(metadata[MetaField.Composer]);
  //   if (composer) {
  //     tags.composer = composer;
  //   }

  //   const composerSort = this.first(metadata[MetaField.ComposerSort]);
  //   if (composerSort) {
  //     tags['TSOC'] = composerSort;
  //   }

  //   const grouping = this.first(metadata[MetaField.Grouping]);
  //   if (grouping) {
  //     tags.contentGroup = grouping;
  //   }

  //   const url = this.first(metadata[MetaField.Url]);
  //   if (url) {
  //     tags.userDefinedUrl = [{
  //       description: 'Generic Url',
  //       url: url
  //     }];
  //   }

  //   const lyrics = this.first(metadata[MetaField.UnSyncLyrics]);
  //   if (lyrics) {
  //     tags.unsynchronisedLyrics = {
  //       language: '',
  //       text: lyrics
  //     };
  //   }

  //   // const syncLyrics = this.first(metadata[MetaField.SyncLyrics]);
  //   // if (syncLyrics) {
  //   //   tags.synchronisedLyrics = [];
  //   // }

  //   const language = this.first(metadata[MetaField.Language]);
  //   if (language) {
  //     tags.language = language;
  //   }

  //   const mood = this.first(metadata[MetaField.Mood]);
  //   if (mood) {
  //     tags.mood = mood;
  //   }

  //   const mediaType = this.first(metadata[MetaField.MediaType]);
  //   if (mediaType) {
  //     tags.mediaType = mediaType;
  //   }

  //   const seconds = this.first(metadata[MetaField.Seconds]);
  //   if (seconds) {
  //     tags.length = (seconds * 1000).toString();
  //   }

  //   const owner = this.first(metadata[MetaField.Owner]);
  //   if (owner) {
  //     tags.fileOwner = owner;
  //   }

  //   const ufId = this.first(metadata[MetaField.UfId]);
  //   if (ufId) {
  //     tags.uniqueFileIdentifier = [{
  //       ownerIdentifier: 'SoloPlayer',
  //       identifier: Buffer.from(ufId)
  //     }];
  //   }

  //   const tempo = this.first(metadata[MetaField.Tempo]);
  //   if (tempo) {
  //     tags.bpm = tempo;
  //   }

  //   const playCount = this.first(metadata[MetaField.PlayCount]);
  //   if (playCount) {
  //     tags['PCNT'] = playCount;
  //   }

  //   const rating = this.first(metadata[MetaField.Rating]);
  //   const ratingNumber = this.utility.isNumber(rating) ? rating : parseInt(rating, 10);
  //   tags.popularimeter = {
  //     email: '',
  //     rating: this.convert5To255(ratingNumber),
  //     counter: playCount ? playCount : 0
  //   };

  //   //await NodeId3.write(tags, filePath);

  //   return tags;
  // }

  private first(array: any[]): any {
    return this.utility.first(array);
  }

  private convert5To255(rating: number): number {
    if (rating < 1) {
      return 0;
    }
    if (rating < 2) {
      return 51; // 1
    }
    if (rating < 3) {
      return 102; // 2
    }
    if (rating < 4) {
      return 153; // 3
    }
    if (rating < 5) {
      return 204; // 4
    }
    return 255; // 5
  }
}
