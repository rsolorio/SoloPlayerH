import { Injectable } from '@angular/core';
import { IDataSourceParsed, IDataSourceService } from './data-source.interface';
import { AudioMetadataService } from 'src/app/platform/audio-metadata/audio-metadata.service';
import { FileService } from 'src/app/platform/file/file.service';
import { IAudioInfo, IIdentifierTag, IMemoTag, IPictureExt, IPopularimeterTag, IUrlTag } from 'src/app/platform/audio-metadata/audio-metadata.interface';
import { IFileInfo, ITag } from 'music-metadata-browser';
import { MetaAttribute } from '../data-transform/data-transform.enum';
import { MusicImageSourceType, MusicImageType, TagPrefix } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { IImageSource } from 'src/app/core/models/core.interface';
import { MimeType } from 'src/app/core/models/core.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class Id3v2SourceService implements IDataSourceService {
  protected inputData: IFileInfo;
  protected audioInfo: IAudioInfo;
  protected tags: ITag[];

  constructor(private metadataService: AudioMetadataService, private fileService: FileService, private utility: UtilityService) { }

  public init(): void {}

  public async setSource(input: IFileInfo, entity: IDataSourceParsed): Promise<IDataSourceParsed> {
    if (this.inputData && this.inputData.path === input.path) {
      return entity;
    }
    this.inputData = input;

    let buffer: Buffer;
    try {
      buffer = await this.fileService.getBuffer(input.path);
    }
    catch (err) {
      entity.error = err;
      return entity;
    }

    // If we get here is because there was no error getting the buffer
    this.audioInfo = await this.metadataService.getMetadata(buffer, MimeType.Mp3, true);
    this.tags = [];

    if (this.audioInfo.error) {
      entity.error = this.audioInfo.error;
      return entity;
    }
    // ID3v1 is being handled by the metadata.common properties
    const tagVersions = ['ID3v2.4', 'ID3v2.3', 'ID3v1'];
    this.tags = [];
    tagVersions.forEach(version => {
      const newTags = this.audioInfo.metadata.native[version];
      if (newTags && newTags.length) {
        this.tags = this.tags.concat(newTags);
      }
    });
    return entity;
  }

  public hasData(): boolean {
    // The issue with this data source is that it provides to types of data in the same source:
    // 1. audio tags
    // 2. audio technical info
    // Even if there's no tags we still need to retrieve the tech info
    return true;
  }

  /**
   * Gets the value of the specified attribute.
   * @param attributeName The name of the metadata attribute to retrieve.
   */
  public async getData(attributeName: string): Promise<any[]> {
    switch (attributeName) {
      case MetaAttribute.Artist:
        if (this.audioInfo.metadata.common.artists) {
          return this.audioInfo.metadata.common.artists;
        }
        break;
      case MetaAttribute.ArtistSort:
        // The library that I use to write tags (taglib-sharp) supports an array of strings
        // for this tag; however, the audio metadata library only supports one string.
        // What's happening here is that the array is being converted to a single string
        // with the items separated by unicode null character: \u0000.
        // For now we only care about multiple artists, that's why we don't need to do the same
        // for album artist sort, album sort, title sort.
        // Here's the process to parse that value.
        const result: string[] = [];
        const artistSorts = this.metadataService.getValues<string>('TSOP', this.tags);
        for (const artistSort of artistSorts) {
          const sorts = artistSort.split('\u0000');
          for (const sort of sorts) {
            result.push(sort);
          }
        }
        return result;
      // User defined tags
      case MetaAttribute.ArtistType:
      case MetaAttribute.AlbumType:
      case MetaAttribute.AlbumArtistStylized:
      case MetaAttribute.Country:
      case MetaAttribute.Subgenre:
      case MetaAttribute.Occasion:
      case MetaAttribute.Instrument:
      case MetaAttribute.Category:
        // TODO: for classifications split value using a separator and return the array of items
        return this.metadataService.getValues<string>(attributeName, this.tags, TagPrefix.UserDefinedText);
      case MetaAttribute.AlbumArtist:
        if (this.audioInfo.metadata.common.albumartist) {
          return [this.audioInfo.metadata.common.albumartist];
        }
        break;
      case MetaAttribute.AlbumArtistSort:
        // TSOP
        if (this.audioInfo.metadata.common.albumartistsort) {
          return [this.audioInfo.metadata.common.albumartistsort];
        }
        break;
      case MetaAttribute.Contributor:
        // Use the album artist tag to get contributors
        const artists = this.metadataService.getValues<string>('TPE2', this.tags);
        // Ignore the first item assuming it is the actual album artist
        if (artists?.length > 1) {
          return artists.slice(1);
        }
        break;
      case MetaAttribute.Album:
        if (this.audioInfo.metadata.common.album) {
          return [this.audioInfo.metadata.common.album];
        }
        break;
      case MetaAttribute.AlbumSort:
        // TSOA
        if (this.audioInfo.metadata.common.albumsort) {
          return [this.audioInfo.metadata.common.albumsort];
        }
        break;
      case MetaAttribute.Year:
        if (this.audioInfo.metadata.common.year) {
          return [this.audioInfo.metadata.common.year];
        }
        break;
      case MetaAttribute.UfId:
        const id = this.metadataService.getValue<IIdentifierTag>('UFID', this.tags);
        if (id) {
          return [id.identifier.toString()];
        }
        break;
      case MetaAttribute.Title:
        if (this.audioInfo.metadata.common.title) {
          return [this.audioInfo.metadata.common.title];
        }
        break;
      case MetaAttribute.TitleSort:
        // TSOT
        if (this.audioInfo.metadata.common.titlesort) {
          return [this.audioInfo.metadata.common.titlesort];
        }
        break;
      case MetaAttribute.TrackNumber:
        if (this.audioInfo.metadata.common.track && this.audioInfo.metadata.common.track.no) {
          return [this.audioInfo.metadata.common.track.no];
        }
        break;
      case MetaAttribute.MediaNumber:
        if (this.audioInfo.metadata.common.disk && this.audioInfo.metadata.common.disk.no) {
          return [this.audioInfo.metadata.common.disk.no];
        }
        break;
      case MetaAttribute.MediaSubtitle:
        if (this.audioInfo.metadata.common.discsubtitle) {
          return this.audioInfo.metadata.common.discsubtitle;
        }
        break;
      case MetaAttribute.Composer:
        if (this.audioInfo.metadata.common.composer) {
          return this.audioInfo.metadata.common.composer;
        }
        break;
      case MetaAttribute.ComposerSort:
        if (this.audioInfo.metadata.common.composersort) {
          return [this.audioInfo.metadata.common.composersort];
        }
        break;
      case MetaAttribute.Publisher:
        if (this.audioInfo.metadata.common.label) {
          return this.audioInfo.metadata.common.label;
        }
        break;
      case MetaAttribute.OriginalArtist:
        if (this.audioInfo.metadata.common.originalartist) {
          return [this.audioInfo.metadata.common.originalartist];
        }
        break;
      case MetaAttribute.OriginalAlbum:
        if (this.audioInfo.metadata.common.originalalbum) {
          return [this.audioInfo.metadata.common.originalalbum];
        }
        break;
      case MetaAttribute.OriginalReleaseYear:
        if (this.audioInfo.metadata.common.originalyear) {
          return [this.audioInfo.metadata.common.originalyear];
        }
        break;
      case MetaAttribute.Comment:
        if (this.audioInfo.metadata.common.comment) {
          return this.audioInfo.metadata.common.comment;
        }
        break;
      case MetaAttribute.Copyright:
        if (this.audioInfo.metadata.common.copyright) {
          return [this.audioInfo.metadata.common.copyright];
        }
        break;
      case MetaAttribute.Grouping:
        if (this.audioInfo.metadata.common.grouping) {
          return [this.audioInfo.metadata.common.grouping];
        }
        break;
      case MetaAttribute.Description:
        const description = this.metadataService.getValue<string>('DESCRIPTION', this.tags, TagPrefix.UserDefinedText);
        if (description) {
          return [description];
        }
        break;
      case MetaAttribute.AddDate:
      case MetaAttribute.ChangeDate:
      case MetaAttribute.PlayDate:
        const dates = this.metadataService.getValues<string>(attributeName, this.tags, TagPrefix.UserDefinedText);
        if (dates?.length) {
          return dates.map(d => new Date(d));
        }
        break;
      case MetaAttribute.Language:
        let language = this.metadataService.getValues<string>('TLAN', this.tags);
        if (!language?.length) {
          language = this.metadataService.getValues<string>('TLAN', this.tags, TagPrefix.UserDefinedText);
        }
        return language;
      case MetaAttribute.Mood:
        let mood = this.metadataService.getValues<string>('TMOO', this.tags);
        if (!mood?.length) {
          mood = this.metadataService.getValues<string>('TMOO', this.tags, TagPrefix.UserDefinedText);
        }
        return mood;
      case MetaAttribute.Rating:
        if (this.audioInfo.metadata.common.rating && this.audioInfo.metadata.common.rating.length) {
          const result = [];
          this.audioInfo.metadata.common.rating.forEach(ratingItem => {
            // TODO: find rating by source
            if (ratingItem.rating) {
              // Since this is a 0-1 value, convert to a 0-5 value
              result.push(Math.round(ratingItem.rating * 5));
            }
          });
          if (result.length) {
            return result;
          }
        }

        const ratingPopularimeter = this.metadataService.getValue<IPopularimeterTag>('POPM', this.tags);
        if (ratingPopularimeter && ratingPopularimeter.rating) {
          // This is a 0-255 value, convert to 0-1 value
          const value = ratingPopularimeter.rating / 255;
          // Convert to a 0-5 value
          return [Math.round(value * 5)];
        }
        break;
      case MetaAttribute.PlayCount:
        const playCount = this.metadataService.getValue<number>('PCNT', this.tags);
        if (playCount) {
          return [playCount];
        }
        const playCountPopularimeter = this.metadataService.getValue<IPopularimeterTag>('POPM', this.tags);
        if (playCountPopularimeter && playCountPopularimeter.counter) {
          return [playCountPopularimeter.counter];
        }
        break;
      case MetaAttribute.PerformerCount:
        const performerCountText = this.metadataService.getValue<string>(attributeName, this.tags, TagPrefix.UserDefinedText);
        if (performerCountText) {
          const performerCount = parseInt(performerCountText, 10);
          if (performerCount > 0) {
            return [performerCount];
          }
        }
        break;
      case MetaAttribute.Url:
        const urlTags = this.metadataService.getValues<IUrlTag>('', this.tags, TagPrefix.UserDefinedUrl);
        if (urlTags?.length && urlTags[0].url) {
          return [urlTags[0].url];
        }
        break;
      case MetaAttribute.VideoUrl:
        const urlVideoTags = this.metadataService.getValues<IUrlTag>('Video', this.tags, TagPrefix.UserDefinedUrl);
        if (urlVideoTags?.length && urlVideoTags[0].url) {
          return [urlVideoTags[0].url];
        }
        break;
      case MetaAttribute.SyncLyrics:
        if (this.audioInfo.metadata.common.lyrics) {
          return this.audioInfo.metadata.common.lyrics;
        }
        break;
      case MetaAttribute.UnSyncLyrics:
        const lyricsTags = this.metadataService.getValues<IMemoTag>('USLT', this.tags);
        if (lyricsTags?.length) {
          const result: string[] = [];
          lyricsTags.forEach(tag => {
            if (tag && tag.text) {
              result.push(tag.text);
            }
          });
          return result;
        }
        break;
      case MetaAttribute.Live:
      case MetaAttribute.Favorite:
        const booleanText = this.metadataService.getValue<string>(attributeName, this.tags, TagPrefix.UserDefinedText);
        // Only return a value if exists
        if (booleanText) {
          return [this.utility.isTrue(booleanText)];
        }
        break;
      case MetaAttribute.Genre:
        if (this.audioInfo.metadata.common.genre) {
          return this.audioInfo.metadata.common.genre;
        }
        break;
      case MetaAttribute.Advisory:
        const advisoryText = this.metadataService.getValue<string>('iTunesAdvisory', this.tags, TagPrefix.UserDefinedText);
        if (advisoryText) {
          const number = parseInt(advisoryText);
          if (!isNaN(number)) {
            return [number];
          }
        }
        break;
      case MetaAttribute.Classification:
        const classData: string[] = [];
        const customTags = this.metadataService.getUserDefinedTags(this.tags, 'ClassificationType');
        for (const customTag of customTags) {
          const tagIdParts = customTag.id.split(':');
          if (tagIdParts.length > 2 && customTag.value) {
            const classTypeName = tagIdParts[2];
            classData.push(`${classTypeName}|${customTag.value.toString()}`);
          }
        }
        return classData;
      case MetaAttribute.ArtistImage:
      case MetaAttribute.AlbumArtistImage:
      case MetaAttribute.AlbumImage:
      case MetaAttribute.AlbumSecondaryImage:
      case MetaAttribute.SingleImage:
      case MetaAttribute.OtherImage:
        return this.findImage(attributeName);
      case MetaAttribute.Seconds:
        if (this.audioInfo.metadata.format.duration) {
          return [this.audioInfo.metadata.format.duration];
        }
        break;
      case MetaAttribute.Bitrate:
        if (this.audioInfo.metadata.format.bitrate) {
          return [this.audioInfo.metadata.format.bitrate];
        }
        break;
      case MetaAttribute.Frequency:
        if (this.audioInfo.metadata.format.sampleRate) {
          return [this.audioInfo.metadata.format.sampleRate];
        }
        break;
      case MetaAttribute.Vbr:
        return [this.audioInfo.metadata.format.codecProfile !== 'CBR'];
      case MetaAttribute.Tempo:
        const tempoText = this.metadataService.getValue<string>('TBPM', this.tags);
        if (tempoText) {
          const tempo = parseInt(tempoText, 10);
          if (tempo > 0) {
            return [tempo];
          }
        }
        break;
      case MetaAttribute.ReplayGain:
        if (this.audioInfo.metadata.format.trackGain) {
          return [this.audioInfo.metadata.format.trackGain];
        }
        break;
      case MetaAttribute.TagFullyParsed:
        return [this.audioInfo.fullyParsed];
      case MetaAttribute.Error:
        if (this.audioInfo.error) {
          return [this.audioInfo.error];
        }
        break;
      case MetaAttribute.Subtitle:
        return this.metadataService.getValues<string>('TIT3', this.tags);
      case MetaAttribute.Owner:
        return this.metadataService.getValues<string>('TOWN', this.tags);
      case MetaAttribute.MediaType:
        return this.metadataService.getValues<string>('TMED', this.tags);
    }
    return [];
  }

  private findImage(field: MetaAttribute): IImageSource[] {
    const result: IImageSource[] = [];
    let imageType = MusicImageType.Default;
    switch (field) {
      case MetaAttribute.ArtistImage:
        imageType = MusicImageType.Artist;
        break;
      case MetaAttribute.AlbumArtistImage:
        imageType = MusicImageType.AlbumArtist;
        break;
      case MetaAttribute.AlbumImage:
        imageType = MusicImageType.Front;
        break;
      case MetaAttribute.AlbumSecondaryImage:
        imageType = MusicImageType.FrontAlternate;
        break;
      case MetaAttribute.SingleImage:
        imageType = MusicImageType.Single;
        break;
      case MetaAttribute.OtherImage:
        imageType = MusicImageType.Other;
        break;
    }
    if (imageType === MusicImageType.Default) {
      return result;
    }
    if (this.audioInfo.metadata.common.picture && this.audioInfo.metadata.common.picture.length) {
      const pictures = this.audioInfo.metadata.common.picture as IPictureExt[];
      pictures.filter(p => p.imageType === imageType).forEach(p => {
        result.push({
          sourcePath: this.inputData.path,
          sourceIndex: p.index,
          sourceType: MusicImageSourceType.AudioTag,
          mimeType: p.format,
          imageType: imageType
        });
      });
    }
    return result;
  }
}
