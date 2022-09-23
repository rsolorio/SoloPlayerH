import { IAudioMetadata } from 'music-metadata-browser';

export interface ILyricsTag {
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

export interface IFileInfo {
  filePath: string;
  paths: string[];
  metadata: IAudioMetadata;
}
