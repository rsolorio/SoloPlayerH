import { ValueListEntryEntity } from "src/app/shared/entities";

export interface IValueListSelectorModel {
  title?: string;
  titleIcon?: string;
  subTitle?: string;
  subTitleIcon?: string;
  valueListTypeId: string;
  entries?: ValueListEntryEntity[];
  selectedIds?: string[];
  selectedValues: string[];
  selectMode: ValueListSelectMode;
  sortByName?: boolean;
  onCancel?: () => void;
  onOk: (values: ValueListEntryEntity[]) => void;
}

export enum ValueListSelectMode {
  /** The item selection will fire the OK action. */
  Quick,
  /** Single item selection and then click OK to apply changes. */
  Single,
  /** Allow multiple item selection and the click OK to apply changes. */
  Multiple,
}