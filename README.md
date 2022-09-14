# SoloPlayer

Mp3 player and mini manager.

## Technologies
This is a hybrid app built with Electron/Angular/Sqlite.

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
- genre
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
- lastSongAddDate
- lastSongChangeDate
- songCount
- complete
- favorite
- albumTypeId

### Artist table
- id
- name
- artistRoleId (Album Artist, Artist)
- artistTypeId (Male, Female, Solo, etc)
- lastSongAddDate
- lastSongChangeDate
- songCount
- albumCount
- country
- favorite

### SongArtist table
- id
- songId
- artistId
- roleId

### Playlist table
- id
- name

### PlaylistSong table
- id
- playlistId
- songId
- sequence

### ClassificationSong table
- id
- classificationName
- classificationType
- songId