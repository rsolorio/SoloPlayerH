export enum RelativeDateUnit {
  Day = 'd',
  Month = 'm',
  Year = 'y'
}

export enum RelativeDateTerm {
  ThisDay = 'td',
  ThisMonth = 'tm',
  ThisYear = 'ty'
}

export enum RelativeDateOperator {
  /** Move operator. Adds units of time to the relative date. */
  Plus = '+',
  /** Move operator. Subtracts units of time to the relative date.  */
  Minus = '-'
}

export enum RelativeDateOperatorNotSupported {
  /** Extend operator. Extends forward the range of the relative date term, excluding the relative date. */
  LessThan = '<',
  /** Extend operator. Extends forward the range of the relative date term, including the relative date. */
  LessThanOrEquals = '<=',
  /** Extend operator. Extends backward the range of the relative date term, excluding the relative date. */
  GreaterThan = '>',
  /** Extend operator. Extends backward the range of the relative date term, including the relative date. */
  GreaterThanOnEquals = '>='
}