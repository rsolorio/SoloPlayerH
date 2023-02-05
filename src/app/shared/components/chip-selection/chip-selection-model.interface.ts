import { ISelectableValue } from "src/app/core/models/core.interface";
import { ICriteriaValueSelector } from "../../services/criteria/criteria.interface";

export interface IChipSelectionModel {
  title?: string;
  selector: ICriteriaValueSelector;
  onCancel?: () => void;
  onOk: (values: ISelectableValue[]) => void;
}