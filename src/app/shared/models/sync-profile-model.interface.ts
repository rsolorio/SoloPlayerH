export interface ISyncProfileParsed {
  id: string;
  name: string;
  description: string;
  directories: string[];
  config: any;
  syncInfo: any;
  syncDate: Date;
}