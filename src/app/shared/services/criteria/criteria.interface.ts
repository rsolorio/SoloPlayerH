import { ISelectableValue } from "src/app/core/models/core.interface";
import { IListModel } from "../../models/list-model.interface";
import { Criteria } from "./criteria.class";
import { CriteriaDataType } from "./criteria.enum";
import { ChipSelectorType } from "../../components/chip-selection/chip-selection-model.interface";

export interface IColumn {
  name: string;
  caption: string;
  dataType: CriteriaDataType;
  icon?: string;
}

export interface IComparison {
  id: number;
  text: string;
  caption: string;
  icon?: string;
}

export interface ISortingAlgorithm {
  id: number;
  name: string;
  sort: (items: any[]) => any[];
}

export interface ICriteriaResult<T> extends IListModel<T> {
  criteria: Criteria;
}

export interface ICriteriaValueSelector {
  column: IColumn;
  type: ChipSelectorType;
  values: ISelectableValue[];
  hidden?: boolean;
  defaultValue?: any;
}