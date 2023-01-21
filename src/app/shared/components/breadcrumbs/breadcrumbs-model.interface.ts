import { BreadcrumbSource } from "../../models/breadcrumbs.enum";
import { ICriteriaValueBaseModel } from "../../models/criteria-base-model.interface";

export interface IBreadcrumbModel {
  origin: BreadcrumbSource;
  sequence?: number;
  caption?: string;
  tooltip?: string;
  icon?: string;
  last?: boolean;
  criteriaList: ICriteriaValueBaseModel[];
  action?: () => void;
}

export interface IBreadcrumbOptions {
  forceReload?: boolean;
  suppressEvents?: boolean;
}