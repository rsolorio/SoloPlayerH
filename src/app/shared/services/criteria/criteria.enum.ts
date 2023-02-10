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

export enum CriteriaTransformAlgorithm {
  None,
  AlternateArtist,
  AlternateLanguageArtist,
  AlternateDecadeGenre,
  AlternateLanguage,
  LimitDuration,
  LimitFileSize,
  LimitSongsPerArtist
}

export enum CriteriaDataType {
  String,
  Number,
  Boolean
}

export enum CriteriaValueEditor {
  Multiple,
  Single,
  YesNo
}