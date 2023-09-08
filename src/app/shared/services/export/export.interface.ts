import { ISongExtendedModel, ISongModel } from "../../models/song-model.interface";
import { Criteria } from "../criteria/criteria.class";

export interface IExportConfig {
  profileId: string;
  directories?: string[];
  filterId?: string;
  playlistId?: string;
  criteria?: Criteria;
  songs?: ISongExtendedModel[];
  songExportEnabled?: boolean;
  playlistsEnabled?: boolean;
  smartlistsEnabled?: boolean;
  autolistsEnabled?: boolean;
  flat?: boolean; // This is maybe part of the mapping?
}