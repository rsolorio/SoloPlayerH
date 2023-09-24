export enum BreakpointMode {
  Small = 'small',
  Large = 'large'
}

/** Contains the number of milliseconds on each time unit. */
export enum Milliseconds {
  Millisecond = 1,
  Second = 1000,
  Minute = 1000 * 60,
  Hour = 1000 * 60 * 60,
  Day = 1000 * 60 * 60 * 24
}

/** Contains the number of bytes on each size unit. */
export enum Bytes {
  Byte = 1,
  Kilobyte = 1024,
  Megabyte = 1048576,
  Gigabyte = 1073741824
}