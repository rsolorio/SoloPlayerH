import { Criteria } from "../criteria/criteria.class";

export interface INavigationInfo {
  route: string;
  options?: INavigationOptions;
}

export interface INavigationOptions {
  criteria?: Criteria;
  queryParams?: any;
  routeParams?: any[];
}