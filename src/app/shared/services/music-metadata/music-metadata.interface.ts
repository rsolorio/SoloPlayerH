import { IAudioMetadata } from 'music-metadata-browser';
import { IFileInfo } from '../file/file.interface';

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

export interface IPictureTag {
  data?: Buffer;
  description?: string;
  format?: string;
  type?: string;
}

export interface IAudioInfo {
  metadata: IAudioMetadata;
  fullyParsed: boolean;
  error?: any;
}

export interface IPopularimeterTag {
  counter: number;
  email: string;
  rating: number;
}