import { ISelectableValue } from "src/app/core/models/core.interface";
import { IListModel } from "../../models/list-model.interface";
import { Criteria } from "./criteria.class";
import { CriteriaDataType, CriteriaValueEditor } from "./criteria.enum";

export interface ICriteriaColumn {
  name: string;
  caption: string;
  dataType: CriteriaDataType;
  icon?: string;
}

export interface ICriteriaResult<T> extends IListModel<T> {
  criteria: Criteria;
}

export interface ICriteriaValueSelector {
  column: ICriteriaColumn;
  editor: CriteriaValueEditor;
  values: ISelectableValue[];
  getValues: () => Promise<ISelectableValue[]>;
}