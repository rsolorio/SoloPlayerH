export enum CriteriaComparison {
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

export enum CriteriaJoinOperator {
  Auto,
  And,
  Or
}

export enum CriteriaSortDirection {
  Ascending,
  Descending
}

export enum CriteriaSortingAlgorithm {
  None,
  DifferentArtist,
  DifferentLanguage,
  DifferentDecadeGenre
}

export enum CriteriaDataType {
  String,
  Number,
  Boolean
}