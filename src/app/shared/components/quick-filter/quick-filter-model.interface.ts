import { ICriteriaValueBaseModel } from "../../models/criteria-base-model.interface";

export interface IFilterField {
  /** Criteria column name. */
  columnName: string;
  /** Human readable name for the column.  */
  caption: string;
  /** List of criteria values associated with this field. */
  criteriaValues: ICriteriaValueBaseModel[];
}