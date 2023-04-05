export interface IFileInfo {
  /** Flag that determines if the item is a directory. */
  isDirectory: boolean;
  /** Full file path. */
  path: string;
  /** The parent directory path. */
  directoryPath?: string;
  /** Name and extension of the file. */
  fullName?: string;
  /** Name of the file without extension. */
  name?: string;
  /** File extension including the dot. */
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
