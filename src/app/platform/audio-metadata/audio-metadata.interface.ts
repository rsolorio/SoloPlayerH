import { IAudioMetadata, IPicture } from 'music-metadata-browser';
import { IFileInfo } from '../file/file.interface';
import { MusicImageType } from './audio-metadata.enum';

/**
 * Defines the structure of the object that holds Lyrics or Comments in a tag.
 */
export interface IMemoTag {
  description?: string;
  language?: string;
  text?: string;
}

export interface IIdentifierTag {
  identifier?: Buffer;
  owner_identifier?: string;
}

export interface IPictureExt extends IPicture {
  index?: number;
  imageType?: MusicImageType;
}

export interface IAudioInfo {
  fileInfo?: IFileInfo;
  metadata: IAudioMetadata;
  fullyParsed: boolean;
  error?: any;
}

export interface IPopularimeterTag {
  counter: number;
  email: string;
  rating: number;
}