# Solo Player

Mp3 player, music manager, tag editor, album art finder, playlist builder, file synchronizer.

## Technologies
This is a hybrid app built with Electron/Angular/Sqlite.

## Tag Support
- Id3
- Multi genre (either with multiple tags or one tag separated by a forward slash)
- Single album artist
- Multiple artist (multiple tags)
- Multiple covers
- Language
- Tokens

## Menu
- Home
- Album Artists
  - Albums (default navigation)
    - Songs
  - Songs
- Artists
  - Songs (default navigation)
- Albums
  - Songs (default navigation)
- Genres
  - Album Artists (default navigation)
    - Albums
      - Songs
  - Albums
  - Songs
- Classifications
  - Album Artists (default navigation)
    - Albums
      - Songs
  - Albums
  - Songs
- Songs
- Playlists
  - Songs
- Filters
  - Songs
- Settings
- Log

## Database schema

### Song table
- id
  - unique identifier
  - automatically created
- name
  - the title of the song
  - ID3 mapping: title
- titleSort
  - Value used to sort the track in a list
  - ID3 mapping: TSOT
- filePath
  - song file location
- externalId
  - unique identifier from an external source
  - ID3 mapping: UFID
- trackNumber
  - number of the track in the album
  - ID3 mapping: track
- mediaNumber
  - number of the media
  - ID3 mapping: disk
- releaseYear
  - year when the song was released
  - ID3 mapping: year
- releaseDecade
  - decade when the song was released
  - automatically calculated
- composer
  - song composer
  - ID3 mapping: composer
- comment
  - song comments
  - ID3 mapping: comment
- addDate
  - Full timestamp describing when the song was added to the collection
  - ID3 mapping: custom AddDate tag
  - Fallback: file creation date
- changeDate
  - Full timestamp describing when the song's information was updated
  - ID3 mapping: custom ChangeDate tag
  - Fallback: file modification date
- language
  - The language of the song
  - ID3 mapping: TLAN
- mood
  - The mood of the audio
  - ID3 mapping: TMOO
- playCount
  - The number of times the audio has been played
  - ID3 mapping: PCNT
  - Fallback: POPM (popularimeter)
- rating
  - How good the audio is.
  - ID3 mapping: POPM (popularimenter)
- lyrics
  - Song lyrics
  - ID3 mapping: USLT (unsynchronized lyrics)
- seconds
  - Length of the audio in seconds
  - Set during the scan process
- duration
  - Length of the audio in HH:mm:ss format
  - Set during the scan process
- bitrate
  - Bits per second in the audio
  - Set during the scan process
- frequency
  - Samples per second in the audio
  - Set during the scan process
- vbr
  - Flag that indicates if it has a variable bitrate
  - Set during the scan process
- replayGain
  - Loudness of the audio
  - Set during the scan process
- fullyParsed
  - Flag that indicates if the audio had to be fully parsed to properly calculate the duration
  - Set during the scan process
- favorite
  - Flag that indicates if this is a favorite audio
  - False by default, set by user
- primaryAlbumId
  - The album associated with the track
- TODO: url, live, explicit, coverSongId, popularity


### Album table
- id
- name
- artistId
- releaseYear
- lastSongAddDate
- lastSongChangeDate
- songCount
- complete
- favorite
- albumTypeId

### Artist table
- id
- name
- artistTypeId (Male, Female, Solo, etc)
- lastSongAddDate
- lastSongChangeDate
- songCount
- albumCount
- country
- favorite

### SongArtist table
- songId
- artistId

### Playlist table
- id
- name

### PlaylistSong table
- playlistId
- songId
- sequence

### Classification table
- id
- name
- classificationType

### SongClassification table
- songId
- classificationId

### PlayHistory table
- songId
- playDate