export interface ICriteriaBaseModel {
    SelectDistinct: boolean;
    RandomOrder: boolean;
    MaximumRows: number;
    PageNumber: number;
}

export interface ICriteriaValueBaseModel {
    ColumnName: string;
    ColumnValue: any;
    Operator: CriteriaOperator;
    OrOperator: boolean;
    SortDirection: CriteriaSortDirection;
    SortSequence: number;
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
