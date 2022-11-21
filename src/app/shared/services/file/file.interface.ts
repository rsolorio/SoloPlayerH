export interface IFileInfo {
  /** Full file path. */
  path: string;
  /** The parent directory path. */
  directoryPath?: string;
  /** Name and extension of the file. */
  fullName?: string;
  /** Name of the file without extension. */
  name?: string;
  /** File extension. */
  extension?: string;
  /** File path parts. */
  parts: string[];
  /** File size in bytes. */
  size: number;
  /** File creation date. */
  addDate?: Date;
  /** File modification date. */
  changeDate?: Date;
}
