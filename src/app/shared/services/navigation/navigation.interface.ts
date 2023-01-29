import { QueryModel } from "../../models/query-model.class";

export interface INavigationInfo {
  route: string;
  options?: INavigationOptions;
}

export interface INavigationOptions {
  query?: QueryModel<any>;
  queryParams?: any;
  routeParams?: any[];
}