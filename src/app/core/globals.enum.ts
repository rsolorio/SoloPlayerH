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

/**
 * Default image sizes.
 */
export enum DefaultImageSrc {
  Full = '../assets/img/default-image-full.jpg',
  Large = '../assets/img/default-image-large.jpg',
  Medium = '../assets/img/default-image-medium.jpg',
  Small = '../assets/img/default-image-small.jpg'
}