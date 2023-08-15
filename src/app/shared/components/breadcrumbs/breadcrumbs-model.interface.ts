import { IIconAction } from "src/app/core/models/core.interface";
import { BreadcrumbDisplayMode, BreadcrumbSource } from "../../models/breadcrumbs.enum";
import { CriteriaItem } from "../../services/criteria/criteria.class";

export interface IBreadcrumbModel extends IIconAction {
  origin: BreadcrumbSource;
  sequence?: number;
  last?: boolean;
  criteriaItem: CriteriaItem;
}

export interface IBreadcrumbsModel {
  displayMode: BreadcrumbDisplayMode;
  items: IBreadcrumbModel[];
}

export interface IBreadcrumbOptions {
  forceReload?: boolean;
  suppressEvents?: boolean;
}