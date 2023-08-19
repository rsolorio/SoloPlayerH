export enum AppEntityIcons {
  AlbumArtist = 'mdi-account-badge mdi',
  Artist = 'mdi-account-music mdi',
  Album = 'mdi-album mdi',
  Song = 'mdi-music-note mdi',
  Classification = 'mdi-sitemap-outline mdi',
  Genre = 'mdi-tag mdi',
  Subgenre = 'mdi-tag-text mdi',
  Occasion = 'mdi-snowman mdi',
  Instrument = 'mdi-guitar-acoustic mdi',
  Category = 'mdi-sticker-text mdi',
  Playlist = 'mdi-playlist-play mdi',
  Smartlist = 'mdi-playlist-star mdi'
}

export enum AppFeatureIcons {
  MultipleArtists = 'mdi-account-multiple mdi',
  MultipleGenres = 'mdi-tag-multiple mdi',
  Statistics = 'mdi-chart-bar mdi',
  TagMapping = 'mdi-tag-check mdi',
  Mobile = 'mdi-cellphone mdi'
}

export enum AppAttributeIcons {
  ArtistName = 'mdi-account mdi',
  AlbumName = 'mdi-album mdi',
  SongName = 'mdi-music mdi',
  TitleSort = 'mdi-sort-alphabetical-variant mdi',
  SongCount = 'mdi-music-circle mdi',
  GenreName = 'mdi-tag mdi',
  FileInfo = 'mdi-file-music mdi',
  ClassificationType = 'mdi-shape mdi',
  Language = 'mdi-translate mdi',
  Mood = 'mdi-emoticon-outline mdi',
  Year = 'mdi-calendar-month mdi',
  Decade = 'mdi-calendar-blank mdi',
  RatingOn = 'mdi-star mdi',
  RatingOff = 'mdi-star-outline mdi',
  RatingHalf = 'mdi-star-half-full mdi',
  FavoriteOn = 'mdi-heart mdi',
  FavoriteOff = 'mdi-heart-outline mdi',
  LiveOn = 'mdi-broadcast mdi',
  LiveOff = 'mdi-broadcast-off mdi',
  LyricsOn = 'mdi-script-text-outline mdi',
  LyricsOff = 'mdi-script-outline mdi',
  Explicit = 'mdi-alpha-e-box-outline mdi',
  BitrateHigh = 'mdi-waveform mdi',
  BitrateLow = 'mdi-wave mdi',
  Image = 'mdi-image-outline mdi',
  TrackNumber = 'mdi-pound mdi',
  MediaNumber = 'mdi-disc mdi',
  Duration = 'mdi-timer mdi',
  PlayCount = 'mdi-counter mdi',
  AddDate = 'mdi-calendar-plus mdi',
  ChangeDate = 'mdi-calendar-edit mdi',
  PlayDate = 'mdi-calendar-check mdi',
  ArtistType = 'mdi-account-group mdi',
  Country = 'mdi-earth mdi',
  Directory = 'mdi-folder mdi',
  AudioDirectory = 'mdi-folder-music mdi',
  PlaylistDirectory = 'mdi-folder-play mdi',
  Description = 'mdi-note-text mdi',
  Grouping = 'mdi-format-list-group mdi',
  Performers = 'mdi-account-multiple mdi',
  Limit = 'mdi-sort-numeric-variant mdi'
}

export enum AppActionIcons {
  CloseClear = 'mdi-close mdi',
  Search = 'mdi-magnify mdi',
  SearchClose = 'mdi-magnify-remove-outline mdi',
  Sort = 'mdi-sort-variant mdi',
  SortAscending = 'mdi-sort-ascending mdi',
  SortDescending = 'mdi-sort-descending mdi-flip-v mdi',
  Filter = 'mdi-filter-outline mdi',
  FilterClose = 'mdi-filter-remove-outline mdi',
  QuickFilter = 'mdi-filter-settings-outline mdi',
  Menu = 'mdi-menu mdi',
  DotsVertical = 'mdi-dots-vertical mdi',
  DotsHorizontal = 'mdi-dots-horizontal mdi',
  ShowSongs = 'mdi-music-box-multiple-outline mdi',
  Scroll = 'mdi-arrow-up-down mdi',
  Edit = 'mdi-pencil-outline mdi',
  Back = 'mdi-arrow-left mdi',
  ExportData = 'mdi-database-export mdi',
  DeleteData = 'mdi-database-remove mdi',
  SearchData = 'mdi-database-search mdi',
  Debug = 'mdi-bug mdi',
  Test = 'mdi-test-tube mdi',
  AddPlaylist = 'mdi-playlist-plus mdi'
}

export enum AppPlayerIcons {
  Play = 'mdi-play mdi',
  Pause = 'mdi-pause mdi',
  Stop = 'mdi-stop mdi',
  Previous = 'mdi-skip-previous mdi',
  Next = 'mdi-skip-next mdi',
  ShuffleOn = 'mdi-shuffle mdi',
  ShuffleOff = 'mdi-shuffle-disabled mdi',
  RepeatAll = 'mdi-repeat mdi',
  RepeatOff = 'mdi-repeat-off mdi',
  RepeatOne = 'mdi-repeat-once mdi',
  Queue = 'mdi-playlist-music-outline mdi',
  BackgroundColor = 'mdi-alpha-b-box-outline mdi',
  PrimaryColor = 'mdi-numeric-1-box-outline mdi',
  SecondaryColor = 'mdi-numeric-2-box-outline mdi',
  SelectedColor = 'mdi-cursor-default-click-outline mdi',
  CurrentColor = 'mdi-bullseye mdi',
  CollapsePlayer = 'mdi-chevron-down mdi'
}

export enum AppViewIcons {
  Home = 'mdi-home mdi',
  Settings = 'mdi-cogs mdi',
  Log = "mdi-file-document-edit mdi",
  About = 'mdi-owl mdi',
  Accent = 'mdi-vanish-quarter mdi'
}

export function getNumericCircleIcon(value: number): string {
  if (value >= 0 && value < 10) {
    return `mdi-numeric-${value}-circle mdi`;
  }
  if (value > 9) {
    return 'mdi-numeric-9-plus-circle mdi';
  }
  return '';
}