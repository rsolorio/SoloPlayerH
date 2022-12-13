import { ICriteriaValueBaseModel } from "./criteria-base-model.interface";

export interface IMusicBreadcrumbModel {
  source: BreadcrumbSource;
  sequence?: number;
  caption: string;
  icon?: string;
  last?: boolean;
  criteriaList: ICriteriaValueBaseModel[];
  action?: () => void;
}

export enum BreadcrumbSource {
  AlbumArtist,
  Artist,
  Album,
  Classification,
  Genre
}

export enum BreadcrumbEventType {
  Add,
  AddMultiple,
  Remove,
  RemoveMultiple,
  Replace
}