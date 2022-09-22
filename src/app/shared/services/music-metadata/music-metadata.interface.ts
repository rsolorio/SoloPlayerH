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
