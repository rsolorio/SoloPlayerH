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
import * as Mp3Tag from 'mp3tag.js';
import { ImageSrcType, MimeType } from 'src/app/core/models/core.enum';
import { ImageService } from 'src/app/platform/image/image.service';

interface IUserDefinedText {
  description: string;
  text: string;
}

interface IUserDefinedUrl {
  description: string;
  url: string;
}

interface IAttachedPicture {
  format: string;
  type: AttachedPictureType;
  description: string;
  data: Buffer
}

enum AttachedPictureType {
  Other,
  Icon,
  OtherIcon,
  Front,
  Back,
  Leaflet,
  Media,
  LeadArtist,
  Artist,
  Conductor,
  Band,
  Composer,
  Lyricist,
  RecordStudio,
  RecordingSession,
  Performance,
  Capture,
  BrightColorFish,
  Illustration,
  BandLogo,
  PublisherLogo
}

/**
 * A transform service to save metadata to an audio file.
 * It uses the specified profile to get a list of data sources;
 * data sources have the responsibility of reading metadata and pass it to the writer.
 * Data sources support custom mapping.
 * This writer requires the mp3tag.js package.
 * I have made a fix to the mp3tag.js dist file to allow saving multiple frames:
 * textFrame function, use replaceAll instead of replace.
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataWriterService extends DataTransformServiceBase<ISongModel, any> {

  constructor(
    private fileService: FileService,
    private utility: UtilityService,
    private imageService: ImageService,
    private entities: DatabaseEntitiesService,
    private songModelSource: SongModelSourceService) {
    super(entities);
  }

  public async process(input: ISongModel): Promise<any> {
    // 1. Get the metadata (the writer also works as reader)
    const metadata = await this.getData(input);
    // 2. Create the file
    const filePath = this.first(metadata[MetaField.FilePath]);
    await this.fileService.copyFile(input.filePath, filePath);
    // 3. Write metadata
    await this.writeMetadata(filePath, metadata);
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

  private async writeMetadata(filePath: string, metadata: KeyValues): Promise<void> {
    const buffer = await this.fileService.getBuffer(filePath);
    const mp3Tag = new Mp3Tag(buffer, true);
    // This will initialize the tags object even if the file has no tags
    mp3Tag.read();
    mp3Tag.tags.v2 = await this.setupV2Tags(metadata);
    // Save to v2.4
    mp3Tag.save({ id3v2: { version: 4 } });
    if (mp3Tag.error) {
      console.error(mp3Tag.error);
    }
    else {
      mp3Tag.read();
      await this.fileService.writeBuffer(filePath, mp3Tag.buffer);
    }
  }

  private async setupV2Tags(metadata: KeyValues): Promise<any> {
    const tags: any = {};
    const frameSeparator = '\\\\';

    const title = this.first(metadata[MetaField.Title]);
    if (title) {
      tags.TIT2 = title;
    }

    const titleSort = this.first(metadata[MetaField.TitleSort]);
    if (titleSort) {
      tags.TSOT = titleSort;
    }

    const subtitle = this.first(metadata[MetaField.Subtitle]);
    if (subtitle) {
      tags.TIT3 = subtitle;
    }

    const artists = metadata[MetaField.Artist];
    if (artists?.length) {
      tags.TPE1 = artists.join(frameSeparator);
    }

    const artistSorts = metadata[MetaField.ArtistSort];
    if (artistSorts?.length) {
      tags.TSOP = artistSorts.join(frameSeparator);
    }

    const albumArtist = this.first(metadata[MetaField.AlbumArtist]);
    if (albumArtist) {
      tags.TPE2 = albumArtist;
    }

    // const albumArtistSort = this.first(metadata[MetaField.AlbumArtistSort]);
    // if (albumArtistSort) {
    //   // This doesn't seem to be supported by the library
    //   // Throws the error: Cannot ready properties of undefined (reading 'write')
    //   tags.TSO2 = albumArtistSort;
    // }

    const album = this.first(metadata[MetaField.Album]);
    if (album) {
      tags.TALB = album;
    }

    const albumSort = this.first(metadata[MetaField.AlbumSort]);
    if (albumSort) {
      tags.TSOA = albumSort;
    }

    const genres = metadata[MetaField.Genre];
    if (genres?.length) {
      tags.TCON = genres.join(frameSeparator);
    }

    const trackNumber = this.first(metadata[MetaField.TrackNumber]);
    if (trackNumber) {
      tags.TRCK = trackNumber.toString();
    }

    const mediaNumber = this.first(metadata[MetaField.MediaNumber]);
    if (mediaNumber) {
      tags.TPOS = mediaNumber.toString();
    }

    const year = this.first(metadata[MetaField.Year]);
    if (year) {
      // Recording year: TYER (2.3), TDRC (2.4)
      // Let's stick with TYER for backwards compatibility
      tags.TYER = year.toString();
      // Support for v2.4 (release year)
      tags.TDRL = year.toString();
    }

    const comment = this.first(metadata[MetaField.Comment]);
    if (comment) {
      tags.COMM = [{
        language: 'eng',
        descriptor: '',
        text: comment
      }];
    }

    const composer = this.first(metadata[MetaField.Composer]);
    if (composer) {
      tags.TCOM = composer;
    }

    const composerSort = this.first(metadata[MetaField.ComposerSort]);
    if (composerSort) {
      tags.TSOC = composerSort;
    }

    const grouping = this.first(metadata[MetaField.Grouping]);
    if (grouping) {
      tags.TIT1 = grouping;
    }

    const lyrics = this.first(metadata[MetaField.UnSyncLyrics]);
    if (lyrics) {
      tags.USLT = {
        language: 'eng',
        descriptor: 'Lyrics',
        text: lyrics
      };
    }

    const language = this.first(metadata[MetaField.Language]);
    if (language) {
      tags.TLAN = language;
    }

    const mood = this.first(metadata[MetaField.Mood]);
    if (mood) {
      tags.TMOO = mood;
    }

    const mediaType = this.first(metadata[MetaField.MediaType]);
    if (mediaType) {
      tags.TMED = mediaType;
    }

    const seconds = this.first(metadata[MetaField.Seconds]);
    if (seconds) {
      tags.TLEN = (seconds * 1000).toString();
    }

    const tempo = this.first(metadata[MetaField.Tempo]);
    if (tempo) {
      tags.TBPM = tempo;
    }

    const owner = this.first(metadata[MetaField.Owner]);
    if (owner) {
      tags.TOWN = owner;
    }

    const ufId = this.first(metadata[MetaField.UfId]);
    if (ufId) {
      tags.UFID = [{
        ownerId: 'SoloPlayer',
        id: Buffer.from(ufId)
      }];
    }

    // const playCount = this.first(metadata[MetaField.PlayCount]);
    // if (playCount) {
    //   // This is not supported
    //   tags.PCNT = playCount;
    // }

    //Include playCount and rating because it is not currently supported by the library
    const udTexts = this.createUserDefinedTexts(metadata, [
      MetaField.AddDate, MetaField.ChangeDate, MetaField.PlayDate, MetaField.PerformerCount,
      MetaField.ArtistType, MetaField.Country, MetaField.AlbumType, MetaField.Favorite, MetaField.Live,
      MetaField.Explicit, MetaField.PlayHistory, MetaField.PlayCount, MetaField.Rating
    ]);
    tags.TXXX = udTexts.concat(this.createUserDefineLists(metadata, [
      MetaField.Subgenre, MetaField. Category, MetaField.Occasion, MetaField.Instrument
    ]));

    //tags.WXXX = this.createUserDefinedUrls(metadata, []);

    const pictures: IAttachedPicture[] = [];
    await this.addPicture(pictures, this.first(metadata[MetaField.AlbumImage]), AttachedPictureType.Front, 'Front');
    await this.addPicture(pictures, this.first(metadata[MetaField.AlbumSecondaryImage]), AttachedPictureType.Front, 'Front2');
    await this.addPicture(pictures, this.first(metadata[MetaField.SingleImage]), AttachedPictureType.Other, 'Single');
    await this.addPicture(pictures, this.first(metadata[MetaField.ArtistImage]), AttachedPictureType.Front, 'Artist');
    if (pictures.length) {
      tags.APIC = pictures;
    }

    return tags;
  }

  private createUserDefinedTexts(metadata: KeyValues, properties: string[]): IUserDefinedText[] {
    const result: IUserDefinedText[] = [];
    for (const property of properties) {
      const value = this.first(metadata[property]);
      if (value) {
        result.push({ description: property, text: value.toString() });
      }
    }
    return result;
  }

  private createUserDefineLists(metadata: KeyValues, properties: string[]): IUserDefinedText[] {
    const result: IUserDefinedText[] = [];
    for (const property of properties) {
      const values = metadata[property];
      if (values?.length) {
        result.push({ description: property, text: values.join(',')})
      }
    }
    return result;
  }

  private createUserDefinedUrls(metadata: KeyValues, properties: string[]): IUserDefinedUrl[] {
    const result: IUserDefinedUrl[] = [];
    for (const property of properties) {
      const value = this.first(metadata[property]);
      if (value) {
        result.push({ description: property, url: value.toString() });
      }
    }
    return result;
  }

  private async addPicture(pictures: IAttachedPicture[], filePath: string, type: AttachedPictureType, description?: string): Promise<void> {
    if (!filePath || !this.fileService.exists(filePath)) {
      return;
    }
    const buffer = await this.imageService.shrinkImageToBuffer({
      src: this.utility.fileToUrl(filePath), srcType: ImageSrcType.FileUrl }, 600);
    pictures.push({
      format: MimeType.Jpg,
      type: type,
      description: description,
      data: buffer
    });
  }

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
