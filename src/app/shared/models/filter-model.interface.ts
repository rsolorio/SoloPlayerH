import { IListItemModel } from "./base-model.interface";

export interface IFilterModel extends IListItemModel {
  description: string;
  filterCriteriaId: string;
  transformAlgorithm: number;
  favorite: boolean;
  filterTypeId: string;
  target: string;
}