import { IListItemModel } from "./base-model.interface";

export interface IFilterModel extends IListItemModel {
  /** Optional text to be displayed before the name of the filter. It can also be used as tag to display filters with the same prefix (feature to come). */
  prefix: string;
  description: string;
  filterCriteriaId: string;
  transformAlgorithm: number;
  favorite: boolean;
  filterTypeId: string;
  target: string;
}