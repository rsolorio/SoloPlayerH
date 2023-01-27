import { ISelectedDataItem } from "src/app/core/models/core.interface";

export interface IFilterColumn {
  columnName: string;
  values: ISelectedDataItem<string>[];
}
