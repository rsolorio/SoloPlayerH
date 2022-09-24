export interface IFileInfo {
  path: string;
  name: string;
  parts: string[];
  size: number;
  addDate?: Date;
  changeDate?: Date;
}
