import { CriteriaTransformAlgorithm } from "../criteria/criteria.enum";

export interface IListTransformValidator {
  reset: () => void;
  validate: (item: any) => boolean;
}

export interface IValidatorInfo {
  validator: IListTransformValidator;
  algorithm: CriteriaTransformAlgorithm;
}

export interface ITransformValidatorFactory {
  get: (algorithm: CriteriaTransformAlgorithm) => IValidatorInfo;
}