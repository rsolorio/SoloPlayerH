# Solo Player

Mp3 player, music manager, track finder, playlist builder, file synchronizer.

## Technologies
This is a hybrid app built with Electron/Angular/Sqlite.

## Tag Support
- Id3
- Multi genre (either with multiple tags or one tag separated by a forward slash)
- Single album artist
- Multiple artist
- Multiple covers
- Language
- Tokens

## Database schema

### Song table
- id
- name
- alias
- albumId
- trackNumber
- mediaNumber
- releaseYear
- releaseDecade
- composer
- addDate
- changeDate
- language
- mood
- playCount
- rating
- comment
- filePath
- seconds
- duration
- bitrate
- vbr
- url
- hasLyric
- lyrics
- live
- explicit
- coverSongId
- popularity
- favorite

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

### Genre table
- id
- name

### SongGenre table
- songId
- genreId

### Playlist table
- id
- name

### PlaylistSong table
- playlistId
- songId
- sequence

### ClassificationSong table
- classificationName
- classificationType
- songId

### PlayHistory table
- songId
- playDate