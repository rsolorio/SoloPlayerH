export interface ICriteriaBaseModel {
    SelectDistinct: boolean;
    MaximumRows: number;
    PageNumber: number;
}

export interface ICriteriaValueBaseModel {
    /** The name of the column. */
    ColumnName: string;
    /** The value of the column. */
    ColumnValue: any;
    /** The operator used to compare. */
    Operator: CriteriaOperator;
    /** The AND/OR operator for joining each expression. */
    OrOperator: boolean;
    /** The direction in case the sorting is enabled. */
    SortDirection: CriteriaSortDirection;
    /** The sequence of the sorting; enable sorting with a value greater than zero. */
    SortSequence: number;
    /** If the column being used in the criteria should be excluded from the SELECT clause. */
    IgnoreInSelect?: boolean;
    /** A human readable representation of the column associated with this criteria. */
    DisplayName?: string;
    /** A human readable representation of the value associated with this criteria. */
    DisplayValue?: string;
}

export enum CriteriaOperator {
    None,
    Equals,
    NotEquals,
    GreaterThan,
    GreaterThanOrEqualTo,
    LessThan,
    LessThanOrEqualTo,
    Like,
    LikeLeft,
    LikeRight,
    NotLike,
    IsNull,
    IsNotNull
}

export enum CriteriaSortDirection {
    Ascending,
    Descending
}

export enum RelativeDateUnit {
    Day = 'd',
    Month = 'm',
    Year = 'y'
}
