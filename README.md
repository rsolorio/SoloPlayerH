# Solo Player

Mp3 player, music manager, tag editor, album art finder, playlist creator, file synchronizer.

This player is for music stored in your device.

## Technologies
This is a hybrid app built with Electron/Angular/Sqlite.

## Features

### Breadcrumbs
The breadcrumbs are displayed as you navigate in the following entities: Classifications, Genres, Album Artists, Albums. They indicate how the current list of entities is being filtered.

### Quick Filters
Each list view supports quick filters which allow you to filter by the most common fields.

### Playlist Support
- PLS
- M3U

### Themes
- Dark

### Tag Support
- Id3v2
- Multi genres (either with multiple tags or one tag separated by a forward slash)
- Single album artist
- Multiple artists (multiple tags)
- Multiple covers
- Language

### Tag Mapping
You can configure how the tag information is retrieved and where it will be stored.

### Album Art Color Palette
The application gets a list of dominant colors for each album art, and you can customize the player view for each individual album art.

### Playlists and Filters
A playlist is a static list of tracks selected by the user. A playlist and its selected tracks are saved in the database. The content of a playlist never changes unless the user adds/removes tracks.

A filter is a dynamic list of tracks based on criteria created by the user. The filter and the criteria are saved in the database, but not the list of tracks. Every time a filter is executed the result might be different. All information provided by the user (rating, play count, mood, language, etc) on a song can be used to build filters.

### And More...
- 0-5 rating mechanism
- Favorites
- Mood
- Language

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
  - Tracks
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
- grouping
  - If the song belongs to a larger category
  - ID3 mapping: TIT1 (content group description)
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
  - Not used in the app, only for research purposes
- favorite
  - Flag that indicates if this is a favorite audio
  - False by default, set by user
- live
  - Flag that indicates if this track is a live performance
  - False by default, set by the user
- primaryAlbumId
  - The album associated with the track
- TODO: url, explicit, coverSongId, popularity


### Album table
- id
- name
- primaryArtistId
- releaseYear
- releaseDecade
- favorite
- albumSort
- albumType

### Artist table
- id
- name
- artistType
- country
- favorite
- artistSort

### SongArtist table
- songId
- artistId
- artistRoleTypeId

### Playlist table
- id
- name
- description
- favorite

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
- primary

### PlayHistory table
- songId
- playDate

### RelatedImage table
- id
- name
- relatedId
  - Id of the associated entity
- sourcePath
  - File path or url of the image source
- sourceType
  - ImageFile, AudioTag, Url
- sourceIndex
  - The index of the image if the source is an audio tag
- imageType
  - Default, Front, Front Alternate, Single, Other
- mimeType
  - The file type specification
- colorSelection
  - An array of colors selected for this image
- colorPalette
  - An array of colors associated with the image

## Scripts
This is a list of NPM package scripts

- npm start
  - Serves and runs the application in electron
  - Sets the browser js file of the angular dev kit to a webpack configuration that can resolve typeorm.

## Dependencies
This is a list of key dependencies in the project.

- [object-hash](https://www.npmjs.com/package/object-hash)
  - Creates the deterministic ids of the entities using their name info.
- [@mdi/font](https://pictogrammers.com/library/mdi/)
  - The base font icon library.
- [music-metadata-browser](https://www.npmjs.com/package/music-metadata-browser)
  - The library used to retrieve all audio metadata information.
- [primeng](https://primeng.org/setup)
  - The component library that provides some special functionality.
    - Context/dropdown menus
- sqlite3
  - SQLite client.
- [typeorm](https://typeorm.io/)
  - ORM for SQLite.

## Fonts
This is a list of free fonts used in this project.

- [Saira](https://fonts.google.com/specimen/Saira)
  - Semi Condensed
  - Extra Condensed
- [Digital-7](https://www.1001fonts.com/digital-7-font.html)
  - Mono