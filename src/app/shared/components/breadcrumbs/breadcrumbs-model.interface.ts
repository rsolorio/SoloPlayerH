import { BreadcrumbSource } from "../../models/breadcrumbs.enum";
import { CriteriaItem } from "../../services/criteria/criteria.class";

export interface IBreadcrumbModel {
  origin: BreadcrumbSource;
  sequence?: number;
  caption?: string;
  tooltip?: string;
  icon?: string;
  last?: boolean;
  hideCaption?: boolean;
  criteriaItem: CriteriaItem;
  action?: () => void;
}

export interface IBreadcrumbOptions {
  forceReload?: boolean;
  suppressEvents?: boolean;
}