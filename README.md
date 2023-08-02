# Solo Player

Audio player, music manager, tag editor, album art finder, playlist creator, file synchronizer.

This is an offline player (for music stored in your device) that currently supports Mp3 files.

## Technologies
This is a hybrid app built with Electron/Angular/Sqlite.

## Features

### Breadcrumbs
The breadcrumbs are displayed as you navigate in the following entities: Classifications, Genres, Album Artists, Albums. They indicate how the current list of entities is being filtered.

### Quick Filters
Each list view supports quick filters which allow you to filter by the most common fields.

### Playlist Support
The application has the ability to import playlists from these file types:
- PLS
- M3U

### Themes
- Dark

### Tag Support
- Id3v1 read
- Id3v2 read/write
- Multi genres
  - Multiple tags
  - One tag separated by a character
- Multiple artists
  - Multiple tags
  - One tag separated by a character
- Single album artist
- Multiple covers
- Language
- Mood

### Tag Mapping
You can configure how the tag information is retrieved and where it will be stored.

### Album Art Color Palette
The application gets a list of dominant colors for each album art, and you can customize the colors of player view for each individual album art.

### Playlists and Filters
A playlist is a static list of tracks selected by the user. A playlist and its selected tracks are saved in the database. The content of a playlist never changes unless the user adds/removes tracks.

A filter is a dynamic list of tracks based on criteria created by the user. The filter and the criteria are saved in the database, but not the list of tracks. Every time a filter is executed the result might be different. All information provided by the user (rating, play count, mood, language, etc) on a song can be used to build filters.

### And More...
- 0-5 rating mechanism
- Favorites
- Custom classifications
- Artist/Song associations
  - Featuring artists
  - Contributors
- Share 'Now Playing' screenshot

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

## Icons

## Database schema
All standard entities have three main fields:
- id
  - unique identifier
  - automatically created
- name
  - a human readable text that represents the entity
- hash
  - a value that makes the record unique amongst all its siblings and used to find/compare records
  - do not confuse this value with the id; the hash is not globally unique

### Song table
- id
- hash
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
  - This can be used to group tracks that belong to the same album
- addDate
  - Full timestamp describing when the song was added to the collection
  - ID3 mapping: custom TXXX:AddDate
  - Fallback: file creation date
- changeDate
  - Full timestamp describing when the song's metadata or information was updated
  - ID3 mapping: custom TXXX:ChangeDate
  - Fallback: file modification date
- replaceDate
  - Full timestamp describing when the song's file or audio signature changed meaning that the file was replaced by a different one.
  - Properties that define this change: file size, bitrate, frequency, seconds, vbr, replayGain
- playDate
  - Full timestamp describing the last time the song was played
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
  - ID3 mapping: custom TXXX:Favorite
  - It can be set the by user
- live
  - Flag that indicates if this track is a live performance
  - ID3 mapping: custom TXXX:Live
  - It can be set the by user
- explicit
  - Flag that indicates if the song has explicit content
  - ID3 mapping: iTunesAdvisory or TXXX:Explicit
  - It can be set the by user
- performers
  - Number of artists performing the song
  - ID3 mapping: custom TXXX:Performers
  - If not present it will automatically calculated based on featuring artists
- primaryAlbumId
  - The album associated with the track
- infoUrl
  - A url that refers to information about the track
  - ID3 mapping: WXXX
- videoUrl
  - A url that refers to a video of the track
- TODO: coverSongId, popularity


### Album table
- primaryArtistId
- releaseYear
- releaseDecade
- favorite
- albumSort
- albumType

### Artist table
- artistType
- country
- favorite
- artistSort

### PartyRelation table
- id
- relatedId
- songId
- albumId
- artistId
- relationTypeId

### Playlist table
- description
- favorite
- groupId
- changeDate

### PlaylistSong table
- playlistId
- songId
- sequence

### SongClassification table
- songId
- classificationId
- primary
  - CONCEPT. A flag that identifies this classification as the primary for the given song and classification type. This flag is not currently being used in the app.

### PlayHistory table
- songId
- playDate

### RelatedImage table
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

### ValueListType table
This table stores list definitions.
- description
- icon
- system

### ValueListEntry table
This table stores the list of values of each list definition.
- valueListTypeId
- description
- icons
- sequence
- isClassification

## Scripts
This is a list of NPM package scripts

- npm start
  - Serves and runs the application in electron

### npm start
This script is configured to run the application with Electron. It sets the browser js file of the angular dev kit to a webpack configuration that can resolve typeorm.

This command runs two other commands, in the following order:
- `postinstall:electron`
  - Runs `postinstall.js`
    - Reads the `browser.js` file from the `angular-devkit` package
    - Removes the `target: web` configuration from the file
    - Adds the `target: electron` configuration to the file
    - The configuration is retrieved from the `postinstall.config.js` file
      - This file creates two configurations: `electron-renderer` and `web`
      - Configurations are retrieved from the `extra-webpack.config.js` file
      - The configurations are real module exports but they are converted to text
- `npm-run-all -p ng:serve electron:serve`
  - `npm-run-all -p` is a command to run tasks in parallel, in this case `ng:serve` and `electron:serve`
    - `ng:serve` is the standard ng serve command
    - `electron:serve` runs three commands, in the following order:
      - `wait-on http-get://localhost:4200/` uses the `wait-on` command to wait until localhost:4200 is available from ng:serve
      - `npm run electron:tsc` transpiles the `main.ts` file
      - `electron ./ --serve` runs the `main.js` file and passes the `--serve` flag which turns on the `electron-reload` package that allows Electron to reload after files are changed

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
- [sqlite3](https://www.npmjs.com/package/sqlite3)
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