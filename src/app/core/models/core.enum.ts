export enum Position {
  None = 'none',
  Left = 'left',
  Right = 'right',
  Top = 'top',
  Bottom = 'bottom',
  Center = 'center'
}

/** Key codes associated with the keypress event. */
export enum KeyCode {
  Enter = 13,
  Zero = 48,
  Nine = 57
}

/**
 * List of color hex values valid for any html color property.
 * This list should match the list of css color variables.
 */
export enum ColorCode {
  Red = '#cc0000',
  Yellow = '#e9ff25',
  Blue = '#2a9fd6',
  Orange = '#ff8800',
  Muted = '#6c757d',
  GrayLight = '#999',
  GrayDark = '#2a2a2a'
}

export enum ImageSrcType {
  DataUrl,
  FileUrl,
  WebUrl
}

export enum TimeAgo {
  Today,
  Yesterday,
  OneWeek,
  TwoWeeks,
  OneMonth,
  OneYear,
  Long
}

export enum MimeType {
  Unknown = '',
  Jpg = 'image/jpeg',
  Mp3 = 'audio/mpeg',
  Flac = 'audio/flac',
  Mp4 = 'video/mp4'
}

export enum Separator {
  MiddleDot = '·',
  Bar = '|',
  Comma = ',',
  BackSlash = '\\',
  ForwardSlash = '/',
  Dash = '-',
  Colon = ':',
  SemiColon = ';'
}

export enum ValueEditorType {
  Text = 'text',
  Number = 'number',
  YesNo = 'yesNo',
  Multiline = 'multiline',
  ValueList = 'valueList'
}