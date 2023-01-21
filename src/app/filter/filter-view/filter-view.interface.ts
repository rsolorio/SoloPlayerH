import { ICriteriaValueBaseModel } from "src/app/shared/models/criteria-base-model.interface";

export interface IFilter {
  name: string;
  systemCriteria: ICriteriaValueBaseModel[];
  breadcrumbCriteria: ICriteriaValueBaseModel[];
  userCriteria: ICriteriaValueBaseModel[];
  fullCriteria: ICriteriaValueBaseModel[];
}