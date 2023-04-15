/** The status of the player. */
export enum PlayerStatus {
  Stopped,
  Playing,
  Paused
}

/** The status of the song relative to the player. */
export enum PlayerSongStatus {
  Empty,
  Playing,
  Paused,
  Stopped
}

// Flags enum
// Usage:
// let myConfig = PlaylistSongStatus.Previous | PlaylistSongStatus.Current;
// let isNext = (myConfig & PlayListSongStatus.Next) == PlayListSongStatus.Next; // false
// let isCurrent = (myConfig & PlayListSongStatus.Current) == PlayListSongStatus.Current; // true
export enum PlaylistSongStatus {
  None = 0,
  Previous = 1 << 0,
  Current = 1 << 1,
  Next = 1 << 2
}

export enum PlayMode {
  Sequence = 1, // mdi-shuffle-disabled
  Random = 2, // mdi-shuffle
  Smart = 3, // mdi-brain
  Custom = 4
}

export enum RepeatMode {
  Disabled, // mdi-repeat-off
  All, // mdi-repeat
  One // mdi-repeat-once
}

// Bitwise
export enum SearchType {
  All = 0,
  Song = 1 << 0,
  Album = 1 << 1,
  Artist = 1 << 2,
  Lyrics = 1 << 3
}