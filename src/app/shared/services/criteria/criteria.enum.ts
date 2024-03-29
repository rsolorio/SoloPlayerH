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
  Descending,
  Alternate
}

export enum CriteriaTransformAlgorithm {
  None,
  /** Alternates artists in a list. */
  ShuffleArtist,
  /** Alternates the combination of language/artist in a list. */
  ShuffleLanguageArtist,
  /** Alternates the combination of decade/genre in a list. */
  ShuffleDecadeGenre,
  /** Alternates languages in a list. */
  ShuffleLanguage,
  /** Alternates the combination of one or more properties in a list. */
  AlternateProperties,
  LimitDuration,
  LimitFileSize,
  LimitSongsPerArtist
}

export enum CriteriaDataType {
  String,
  Number,
  Boolean
}