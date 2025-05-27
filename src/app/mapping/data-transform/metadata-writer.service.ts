import { Injectable } from '@angular/core';
import { DataTransformServiceBase } from './data-transform-service-base.class';
import { IDataSourceService } from '../data-source/data-source.interface';
import { KeyValues } from 'src/app/core/models/core.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { DataSourceType } from '../data-source/data-source.enum';
import { SongModelSourceService } from '../data-source/song-model-source.service';
import { FileService } from 'src/app/platform/file/file.service';
import { MetaAttribute } from './data-transform.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ImageSrcType, MimeType } from 'src/app/core/models/core.enum';
import { ImageService } from 'src/app/platform/image/image.service';
import { IMetadataWriterOutput } from './data-transform.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { LogLevel } from 'src/app/core/services/log/log.enum';
import { appName } from 'src/app/app-exports';
import { IExportConfig } from 'src/app/sync-profile/export/export.interface';
import { MpegTagVersion } from 'src/app/shared/models/music.enum';
const MP3Tag = require('mp3tag.js');

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
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataWriterService extends DataTransformServiceBase<ISongModel, ISongModel, IMetadataWriterOutput> {
  constructor(
    private log: LogService,
    private fileService: FileService,
    private utility: UtilityService,
    private imageService: ImageService,
    private songModelSource: SongModelSourceService) {
    super();
  }

  public async run(input: ISongModel): Promise<IMetadataWriterOutput> {
    // 1. Get only the filePath metadata to determine if we need to keep getting the rest of the metadata
    const values = await this.getAttributeData(input, MetaAttribute.FilePath);
    const destinationPath = this.first(values);

    const result: IMetadataWriterOutput = {
      metadata: null,
      sourcePath: input.filePath,
      destinationPath: destinationPath
    };

    // If the file already exists in the destination, skip it
    if (this.fileService.exists(destinationPath)) {
      result.metadata = {};
      result.metadata[MetaAttribute.FilePath] = values;
      result.skipped = true;
      return result;
    }

    // 2. Get the data
    result.metadata = await this.getData(input);
    // 3. Load the buffer
    const originalAudioBuffer = await this.fileService.getBuffer(result.sourcePath);
    // 4. Write metadata
    await this.writeMetadata(originalAudioBuffer, result.destinationPath, result.metadata);
    return result;
  }

  /**
   * If you want to save data in tags:
   * 1. Look for the metadata attributes supported (consumed) by the setupV2Tags method.
   * 2. Add the metadata attribute to the "attributes" property of the data source. This will ensure the attributes are populated with a value.
   * 2a. Adding the attribute is mandatory since the attribute value will be used to populate the tag.
   * 3. Confirm the source (song model) has hardcoded logic to find the data associated to the metadata attribute.
   * 4. If you don't want to use the default logic or if it doesn't exist, you can setup a mapping and use an expression to get the data from the source.
   * 4a. Remember, an expression is a combination of hardcoded text and/or placeholders (fields or functions)
   * 4b. Do not confuse a field placeholder used in an expression with a metadata attribute.
   * 4c. The field does not need to exist in the "attributes" property, but it has to exist as a column in the source (song model).
   * How the full logic works:
   * 1. Each data source service iterates the attributes and retrieves data using the getData method
   * 2. Attributes will be populated with data and they will become the metadata attributes.
   * 3. The songModelSource.getData method retrieves data from mappings first (if exist) and then from hardcoded logic associated with each attribute
   * 4. Mappings retrieve data using a parser that processes expression fields and functions ("expression fields" match columns from the views providing data)
   * 5. Hardcoded logic generally retrieves data associating a meta attribute with the property of the input data or using built-in methods
   * 6. Lastly it gets user defined mappings, also using expressions and the parser
   * Once this happens, the writer will use the metadata to locate the data to write to the supported tags, and to user defined tags.
   * @param input The song model
   * @returns A metadata object
   */
  protected async getData(input: ISongModel): Promise<KeyValues> {
    const result: KeyValues = {};
    for (const source of this.sources) {
      if (source.service) {
        const initResult = await source.service.setSource(input, source, this.syncProfile);
        if (!initResult.error) {
          await this.setValuesAndMappings(result, source);
        }
      }
    }
    return result;
  }

  protected async getAttributeData(input: ISongModel, attribute: MetaAttribute): Promise<any[]> {
    let result: any[] = [];
    for (const source of this.sources) {
      if (source.service) {
        const initResult = await source.service.setSource(input, source, this.syncProfile);
        if (!initResult.error && !result.length) {
          result = await source.service.getData(attribute);
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

  private async writeMetadata(existingAudioBuffer: Buffer, newFilePath: string, metadata: KeyValues): Promise<void> {
    const config = this.syncProfile.configObj as IExportConfig;
    // Save to v2.3 by default, and also support v2.4
    // TODO: save to v1.1
    // TODO: save to other tag system if the file is not mp3
    const v2Version = config?.mpegTag?.toLowerCase() === MpegTagVersion.Id3v24.toLowerCase() ? 4 : 3;
    const mp3Tag = new MP3Tag(existingAudioBuffer, this.log.level === LogLevel.Verbose);
    // This will initialize the tags object even if the file has no tags
    mp3Tag.read();
    mp3Tag.tags.v2 = await this.setupV2Tags(metadata, v2Version);
    mp3Tag.save({ id3v2: { include: undefined, unsynch: undefined, padding: undefined, version: v2Version } });

    if (mp3Tag.error) {
      console.error(mp3Tag.error);
    }
    else {
      mp3Tag.read();
      // Write the buffer of the existing file to a new file
      await this.fileService.writeBuffer(newFilePath, mp3Tag.buffer as Buffer);
      // Setting the change date will only happen if the changeDate field is configured in the data source
      const changeDate = this.first(metadata[MetaAttribute.ChangeDate]) as Date;
      if (changeDate) {
        // Write this info to the actual file
        this.fileService.setTimes(newFilePath, changeDate, changeDate);
      }
    }
  }

  /**
   * Adds metadata tags and returns an object that follows the tag object of the mp3tag library.
   * Id3 official site (cached): https://web.archive.org/web/20211214132114/https://id3.org/
   * Supported tags: https://mp3tag.js.org/docs/frames.html
   * Mp3Tag reference: https://docs.mp3tag.de/mapping/
   * Picard reference: https://picard-docs.musicbrainz.org/v2.6/en/appendices/tag_mapping.html
   * Other reference: https://exiftool.org/TagNames/ID3.html
   * One more with details: https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html
   * Reference to taglib: https://github.com/mono/taglib-sharp
   * This writer consumes these meta attributes:
   * title, titleSort, subtitle, artist, artistSort, albumArtist, albumArtistSort,
   * album, albumSort, genre, track, media, year, addDate, comment, description, composer, composerSort,
   * publisher, grouping, unSyncLyrics, language, mood, mediaType, mediaSubtitle,
   * seconds, tempo (bpm), owner, ufid, playCount, rating, replayGain, url, videoUrl, advisory,
   * subgenre, category, occasion, instrument,
   * albumImage, albumSecondaryImage, singleImage, albumArtistImage
   */
  private async setupV2Tags(metadata: KeyValues, v2Version: number): Promise<any> {
    const tags: any = {};
    const frameSeparator = '\\\\';
    const valueSeparator = ', ';

    const title = this.first(metadata[MetaAttribute.Title]);
    if (title) {
      tags.TIT2 = title;
    }

    const titleSort = this.first(metadata[MetaAttribute.TitleSort]);
    if (titleSort) {
      tags.TSOT = titleSort;
    }

    const subtitle = this.first(metadata[MetaAttribute.Subtitle]);
    if (subtitle) {
      tags.TIT3 = subtitle;
    }

    const artists = metadata[MetaAttribute.Artist];
    if (artists?.length) {
      if (v2Version === 4) {
        tags.TPE1 = artists.join(frameSeparator);
      }
      else {
        tags.TPE1 = artists.join(valueSeparator);
      }
    }

    const artistSorts = metadata[MetaAttribute.ArtistSort];
    if (artistSorts?.length) {
      if (v2Version === 4) {
        tags.TSOP = artistSorts.join(frameSeparator);
      }
      else {
        tags.TSOP = artistSorts.join(valueSeparator);
      }
    }

    const albumArtist = this.first(metadata[MetaAttribute.AlbumArtist]);
    if (albumArtist) {
      tags.TPE2 = albumArtist;
    }

    const albumArtistSort = this.first(metadata[MetaAttribute.AlbumArtistSort]);
    if (albumArtistSort) {
      tags.TSO2 = albumArtistSort;
    }

    const album = this.first(metadata[MetaAttribute.Album]);
    if (album) {
      tags.TALB = album;
    }

    const albumSort = this.first(metadata[MetaAttribute.AlbumSort]);
    if (albumSort) {
      tags.TSOA = albumSort;
    }

    const genres = metadata[MetaAttribute.Genre];
    if (genres?.length) {
      if (v2Version === 4) {
        tags.TCON = genres.join(frameSeparator);
      }
      else {
        tags.TCON = genres.join(valueSeparator);
      }
    }

    const trackNumber = this.first(metadata[MetaAttribute.TrackNumber]);
    if (trackNumber) {
      tags.TRCK = trackNumber.toString();
    }

    const mediaNumber = this.first(metadata[MetaAttribute.MediaNumber]);
    if (mediaNumber) {
      tags.TPOS = mediaNumber.toString();
    }

    const year = this.first(metadata[MetaAttribute.Year]);
    if (year) {
      // Recording year (v2.3), for backwards compatibility
      tags.TYER = year.toString();
      // Release date (v2.4)
      tags.TDRL = year.toString();
      // Recording date (v2.4)
      tags.TDRC = year.toString();
    }

    const addDate = this.first(metadata[MetaAttribute.AddDate]);
    if (addDate) {
      // Encoding time
      tags.TDEN = this.utility.toDateTimeISONoTimezone(addDate);
    }

    const comment = this.first(metadata[MetaAttribute.Comment]);
    if (comment) {
      tags.COMM = [{
        language: 'eng',
        descriptor: '',
        text: comment
      }];
    }

    const composers = metadata[MetaAttribute.Composer];
    if (composers?.length) {
      if (v2Version === 4) {
        tags.TCOM = composers.join(frameSeparator);
      }
      else {
        tags.TCOM = composers.join(valueSeparator);
      }
    }

    const composerSorts = metadata[MetaAttribute.ComposerSort];
    if (composerSorts?.length) {
      if (v2Version === 4) {
        tags.TSOC = composerSorts.join(frameSeparator);
      }
      else {
        tags.TSOC = composerSorts.join(valueSeparator);
      }
    }

    const publisher = this.first(metadata[MetaAttribute.Publisher]);
    if (publisher) {
      tags.TPUB = publisher;
    }

    const grouping = this.first(metadata[MetaAttribute.Grouping]);
    if (grouping) {
      tags.TIT1 = grouping;
    }

    const lyrics = this.first(metadata[MetaAttribute.UnSyncLyrics]);
    if (lyrics) {
      tags.USLT = [{
        language: 'eng',
        descriptor: '',
        text: lyrics
      }];
    }

    const language = this.first(metadata[MetaAttribute.Language]);
    if (language) {
      tags.TLAN = language;
    }

    const mood = this.first(metadata[MetaAttribute.Mood]);
    if (mood) {
      tags.TMOO = mood;
    }

    const mediaType = this.first(metadata[MetaAttribute.MediaType]);
    if (mediaType) {
      tags.TMED = mediaType;
    }

    const mediaSubtitle = this.first(metadata[MetaAttribute.MediaSubtitle]);
    if (mediaSubtitle) {
      tags.TSST = mediaSubtitle;
    }

    const seconds = this.first(metadata[MetaAttribute.Seconds]);
    if (seconds) {
      tags.TLEN = (seconds * 1000).toString();
    }

    const tempo = this.first(metadata[MetaAttribute.Tempo]);
    if (tempo) {
      tags.TBPM = tempo;
    }

    const owner = this.first(metadata[MetaAttribute.Owner]);
    if (owner) {
      tags.TOWN = owner;
    }

    const ufId = this.first(metadata[MetaAttribute.UfId]);
    if (ufId) {
      tags.UFID = [{
        ownerId: appName,
        id: Buffer.from(ufId)
      }];
    }

    const playCount = this.first(metadata[MetaAttribute.PlayCount]);
    if (playCount) {
      tags.PCNT = playCount.toString();
    }

    const udTexts = this.createUserDefinedTexts(metadata, [
      MetaAttribute.Subgenre, MetaAttribute. Category, MetaAttribute.Occasion, MetaAttribute.Instrument
    ], true);

    const rating = this.first(metadata[MetaAttribute.Rating]);
    if (rating) {
      // Standard id3 popularimeter tag
      tags.POPM = [{
        // TODO: use module option
        email: appName,
        rating: this.convert5To255(rating),
        counter: playCount ? playCount : 0
      }];
      // Generic rating tag mostly used in flac files
      udTexts.push({
        description: 'RATING',
        text: this.convert5To100(rating).toString()
      });
    }

    const advisory = this.first(metadata[MetaAttribute.Advisory]);
    if (advisory) {
      udTexts.push({
        description: 'ITUNESADVISORY',
        text: advisory.toString()
      });
    }

    const description = this.first(metadata[MetaAttribute.Description]);
    if (description) {
      udTexts.push({
        description: 'DESCRIPTION',
        text: description
      });
    }

    // From chat gpt: the valid range of ReplayGain values is typically between -18dB to +18dB;
    // this range allows for sufficient adjustment to normalize the volume of audio tracks without
    // causing distortion or clipping.
    const replayGain = this.first(metadata[MetaAttribute.ReplayGain]);
    if (replayGain) {
      udTexts.push({
        description: 'REPLAYGAIN_TRACK_GAIN',
        text: replayGain.toString()
      });
    }

    const userDefinedFields = metadata[MetaAttribute.UserDefinedField];
    if (userDefinedFields?.length) {
      tags.TXXX = udTexts.concat(this.createUserDefinedTexts(metadata, userDefinedFields, false));
    }
    else {
      tags.TXXX = udTexts;
    }

    const urls: IUserDefinedUrl[] = [];
    const url = this.first(metadata[MetaAttribute.Url]);
    if (url) {
      urls.push({ description: '', url: url });
    }
    const videoUrl = this.first(metadata[MetaAttribute.VideoUrl]);
    if (videoUrl) {
      urls.push({ description: 'Video', url: videoUrl });
    }
    if (urls.length) {
      tags.WXXX = urls;
    }

    const pictures: IAttachedPicture[] = [];
    await this.addPicture(pictures, this.first(metadata[MetaAttribute.AlbumImage]), AttachedPictureType.Front, 'Front');
    await this.addPicture(pictures, this.first(metadata[MetaAttribute.AlbumSecondaryImage]), AttachedPictureType.Front, 'Front2');
    await this.addPicture(pictures, this.first(metadata[MetaAttribute.SingleImage]), AttachedPictureType.Other, 'Single');
    await this.addPicture(pictures, this.first(metadata[MetaAttribute.AlbumArtistImage]), AttachedPictureType.LeadArtist, albumArtist);
    if (pictures.length) {
      tags.APIC = pictures;
    }

    return tags;
  }

  private createUserDefinedTexts(metadata: KeyValues, properties: string[], upperCaseDescription: boolean): IUserDefinedText[] {
    const result: IUserDefinedText[] = [];
    for (const property of properties) {
      let values = metadata[property];
      if (values?.length) {
        // Format as date or string
        values = values.map(value => {
          if (this.utility.isDate(value)) {
            return this.utility.toReadableDateAndTime(value);
          }
          return value.toString();
        });
        result.push({ description: upperCaseDescription ? property.toUpperCase() : property, text: values.join(',')});
      }
    }
    return result;
  }

  private async addPicture(pictures: IAttachedPicture[], filePath: string, type: AttachedPictureType, description?: string): Promise<void> {
    if (!filePath || !this.fileService.exists(filePath)) {
      return;
    }
    let buffer = await this.imageService.shrinkImageToBuffer({
      src: this.utility.fileToUrl(filePath), srcType: ImageSrcType.FileUrl }, 600);
    if (!buffer) {
      buffer = await this.fileService.getBuffer(filePath);
    }
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

  /**
   * Converts 0-5 rating to 0-100 rating.
   */
  private convert5To100(rating: number): number {
    return rating * 20;
  }

  /**
   * Converts 0-5 rating to 0-255 rating.
   */
  private convert5To255(rating: number): number {
    // Based on this thread:
    // https://www.mediamonkey.com/forum/viewtopic.php?p=450821&sid=3d55a9a4af0caeffd6fbc4147772e346#p450821
    // This is the proposal that covers most of the cases
    // 00/0.0 = 000
    // 02/1.0 = 001 (special case)
    // 01/0.5 = 022-002
    // 02/1.0 = 031-023
    // 03/1.5 = 063-032
    // 04/2.0 = 095-064
    // 05/2.5 = 127-096
    // 06/3.0 = 159-128
    // 07/3.5 = 195-160
    // 08/4.0 = 223-196
    // 09/4.5 = 224-254
    // 10/5.0 = 255

    if (rating < 1) {
      return 0;
    }
    if (rating < 2) {
      return 31; // 1
    }
    if (rating < 3) {
      return 95; // 2
    }
    if (rating < 4) {
      return 159; // 3
    }
    if (rating < 5) {
      return 223; // 4
    }
    return 255; // 5
  }
}
