import { RelativeDateTerm, RelativeDateOperator, RelativeDateUnit } from "./relative-date.enum";

export interface IRelativeDateValue {
  expression: string;
  unit: RelativeDateUnit;
  quantity: number;
}

/**
 * Contains the pieces of a relative date expression.
 */
export interface IRelativeDateExpression {
  original: string;
  excess?: string;
  term: RelativeDateTerm;
  operator: RelativeDateOperator;
  value: IRelativeDateValue;
}