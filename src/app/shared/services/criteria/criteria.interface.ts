import { IListModel } from "../../models/list-model.interface";
import { Criteria } from "./criteria.class";
import { CriteriaDataType } from "./criteria.enum";

export interface ICriteriaColumn {
  name: string;
  caption: string;
  dataType: CriteriaDataType;
  icon?: string;
}

export interface ICriteriaResult<T> extends IListModel<T> {
  criteria: Criteria;
}