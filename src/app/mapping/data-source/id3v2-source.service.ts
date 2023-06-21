import { Injectable } from '@angular/core';
import { IDataSource, ILoadInfo } from './data-source.interface';
import { AudioMetadataService } from 'src/app/platform/audio-metadata/audio-metadata.service';
import { FileService } from 'src/app/platform/file/file.service';
import { IAudioInfo, IIdentifierTag, IMemoTag, IPictureExt, IPopularimeterTag } from 'src/app/platform/audio-metadata/audio-metadata.interface';
import { ITag } from 'music-metadata-browser';
import { LogService } from 'src/app/core/services/log/log.service';
import { MetaField } from '../data-transform/data-transform.enum';
import { MusicImageSourceType, MusicImageType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { IImageSource } from 'src/app/core/models/core.interface';

@Injectable({
  providedIn: 'root'
})
export class Id3v2SourceService implements IDataSource {
  protected loadInfo: ILoadInfo;
  protected audioInfo: IAudioInfo;
  protected tags: ITag[];

  constructor(private metadataService: AudioMetadataService, private fileService: FileService, private log: LogService) { }

  public async load(info: ILoadInfo): Promise<ILoadInfo> {
    if (this.loadInfo && this.loadInfo.filePath === info.filePath) {
      return info;
    }
    this.loadInfo = info;
    const buffer = await this.fileService.getBuffer(info.filePath);
    this.audioInfo = await this.metadataService.getMetadata(buffer, true);

    this.tags = [];

    if (this.audioInfo.error) {
      this.loadInfo.error = this.audioInfo.error;
      return this.loadInfo;
    }
    let id3Tags = this.audioInfo.metadata.native['ID3v2.4'];
    if (!id3Tags || !id3Tags.length) {
      id3Tags = this.audioInfo.metadata.native['ID3v2.3'];
    }
    if (id3Tags) {
      this.tags = id3Tags;
    }
    return this.loadInfo;
  }

  public async get(propertyName: string): Promise<any[]> {
    switch (propertyName) {
      case MetaField.Artist:
        if (this.audioInfo.metadata.common.artists) {
          return this.audioInfo.metadata.common.artists;
        }
        break;
      case MetaField.ArtistSort:
        return this.metadataService.getValues<string>('TSOP', this.tags);
      case MetaField.ArtistType:
        return this.metadataService.getValues<string>('ArtistType', this.tags, true);
      case MetaField.ArtistStylized:
        return this.metadataService.getValues<string>('ArtistStylized', this.tags, true);
      case MetaField.AlbumArtist:
        if (this.audioInfo.metadata.common.albumartist) {
          return [this.audioInfo.metadata.common.albumartist];
        }
        break;
      case MetaField.AlbumArtistSort:
        if (this.audioInfo.metadata.common.albumartistsort) {
          return [this.audioInfo.metadata.common.albumartistsort];
        }
        break;
      case MetaField.Album:
        if (this.audioInfo.metadata.common.album) {
          return [this.audioInfo.metadata.common.album];
        }
        break;
      case MetaField.AlbumSort:
        if (this.audioInfo.metadata.common.albumsort) {
          return [this.audioInfo.metadata.common.albumsort];
        }
        break;
      case MetaField.AlbumType:
        return this.metadataService.getValues<string>('AlbumType', this.tags, true);
      case MetaField.Year:
        if (this.audioInfo.metadata.common.year) {
          return [this.audioInfo.metadata.common.year];
        }
        break;
      case MetaField.Country:
        return this.metadataService.getValues<string>('Country', this.tags, true);
      case MetaField.UfId:
        const id = this.metadataService.getValue<IIdentifierTag>('UFID', this.tags);
        if (id) {
          return [id.identifier.toString()];
        }
        break;
      case MetaField.Title:
        if (this.audioInfo.metadata.common.title) {
          return [this.audioInfo.metadata.common.title];
        }
        break;
      case MetaField.TitleSort:
        if (this.audioInfo.metadata.common.titlesort) {
          return [this.audioInfo.metadata.common.titlesort];
        }
        break;
      case MetaField.TrackNumber:
        if (this.audioInfo.metadata.common.track && this.audioInfo.metadata.common.track.no) {
          return [this.audioInfo.metadata.common.track.no];
        }
        break;
      case MetaField.MediaNumber:
        if (this.audioInfo.metadata.common.disk && this.audioInfo.metadata.common.disk.no) {
          return [this.audioInfo.metadata.common.disk.no];
        }
        break;
      case MetaField.Composer:
        if (this.audioInfo.metadata.common.composer) {
          return this.audioInfo.metadata.common.composer;
        }
        break;
      case MetaField.Comment:
        if (this.audioInfo.metadata.common.comment) {
          return this.audioInfo.metadata.common.comment;
        }
        break;
      case MetaField.Grouping:
        if (this.audioInfo.metadata.common.grouping) {
          return [this.audioInfo.metadata.common.grouping];
        }
        break;
      case MetaField.AddDate:
        const addDates = this.metadataService.getValues<string>('AddDate', this.tags, true);
        if (addDates?.length) {
          return addDates.map(d => new Date(d));
        }
        break;
      case MetaField.ChangeDate:
        const changeDates = this.metadataService.getValues<string>('ChangeDate', this.tags, true);
        if (changeDates?.length) {
          return changeDates.map(d => new Date(d));
        }
        break;
      case MetaField.Language:
        return this.metadataService.getValues<string>('TLAN', this.tags, true);
      case MetaField.Mood:
        return this.metadataService.getValues<string>('TMOO', this.tags, true);
      case MetaField.Rating:
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
      case MetaField.PlayCount:
        const playCounts = this.metadataService.getValues<number>('PCNT', this.tags);
        if (playCounts.length) {
          return playCounts;
        }
        const playCountPopularimeter = this.metadataService.getValue<IPopularimeterTag>('POPM', this.tags);
        if (playCountPopularimeter && playCountPopularimeter.counter) {
          return [playCountPopularimeter.counter];
        }
        break;
      case MetaField.SyncLyrics:
        if (this.audioInfo.metadata.common.lyrics) {
          return this.audioInfo.metadata.common.lyrics;
        }
        break;
      case MetaField.UnSyncLyrics:
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
      case MetaField.Live:
        return this.metadataService.getValues<string>('Live', this.tags, true);
      case MetaField.Genre:
        if (this.audioInfo.metadata.common.genre) {
          return this.audioInfo.metadata.common.genre;
        }
        break;
      case MetaField.Classification:
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
      case MetaField.ArtistImage:
      case MetaField.AlbumArtistImage:
      case MetaField.AlbumImage:
      case MetaField.AlbumSecondaryImage:
      case MetaField.SingleImage:
      case MetaField.OtherImage:
        return this.findImage(propertyName);
      case MetaField.Seconds:
        if (this.audioInfo.metadata.format.duration) {
          return [this.audioInfo.metadata.format.duration];
        }
        return [0];
      case MetaField.Bitrate:
        if (this.audioInfo.metadata.format.bitrate) {
          return [this.audioInfo.metadata.format.bitrate];
        }
        return [0];
      case MetaField.Frequency:
        if (this.audioInfo.metadata.format.sampleRate) {
          return [this.audioInfo.metadata.format.sampleRate];
        }
        return [0];
      case MetaField.Vbr:
        return [this.audioInfo.metadata.format.codecProfile !== 'CBR'];
      case MetaField.ReplayGain:
        if (this.audioInfo.metadata.format.trackGain) {
          return [this.audioInfo.metadata.format.trackGain];
        }
        return [0];
      case MetaField.TagFullyParsed:
        return [this.audioInfo.fullyParsed];
      case MetaField.Error:
        if (this.audioInfo.error) {
          return [this.audioInfo.error];
        }
        break;
      case MetaField.SubTitle:
        return this.metadataService.getValues<string>('TIT3', this.tags);
    }
    return [];
  }

  private findImage(field: MetaField): IImageSource[] {
    const result: IImageSource[] = [];
    let imageType = MusicImageType.Default;
    switch (field) {
      case MetaField.ArtistImage:
      case MetaField.AlbumArtistImage:
        imageType = MusicImageType.Artist;
        break;
      case MetaField.AlbumImage:
        imageType = MusicImageType.Front;
        break;
      case MetaField.AlbumSecondaryImage:
        imageType = MusicImageType.FrontAlternate;
        break;
      case MetaField.SingleImage:
        imageType = MusicImageType.Single;
        break;
      case MetaField.OtherImage:
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
          sourcePath: this.loadInfo.filePath,
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
