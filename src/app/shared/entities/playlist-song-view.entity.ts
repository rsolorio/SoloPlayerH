import { ViewColumn, ViewEntity } from 'typeorm';
import { IPlaylistSongModel } from '../models/playlist-song-model.interface';
import { PlaylistSongEntity } from './playlist-song.entity';
import { SongViewBaseEntity } from './song-view-base.entity';

/**
 * View that integrates the song information with the playlist song data.
 */
@ViewEntity({
  name: 'playlistSongView',
  expression: ds => ds
    .createQueryBuilder(PlaylistSongEntity, 'playlistSong')
    .innerJoin('song', 'song', 'playlistSong.songId = song.id')
    .innerJoin('album', 'album', 'song.primaryAlbumId = album.id')
    .innerJoin('artist', 'artist', 'album.primaryArtistId = artist.id')
    .select('playlistSong.playlistId', 'playlistId')
    .addSelect('playlistSong.songId', 'songId')
    .addSelect('playlistSong.sequence', 'sequence')
    .addSelect('song.id', 'id')
    .addSelect('song.name', 'name')
    .addSelect('song.hash', 'hash')
    .addSelect('album.id', 'primaryAlbumId')
    .addSelect('song.filePath', 'filePath')
    .addSelect('song.fileSize', 'fileSize')
    .addSelect('song.trackNumber', 'trackNumber')
    .addSelect('song.mediaNumber', 'mediaNumber')
    .addSelect('song.releaseYear', 'releaseYear')
    .addSelect('song.releaseDecade', 'releaseDecade')
    .addSelect('song.rating', 'rating')
    .addSelect('song.playCount', 'playCount')
    .addSelect('song.performers', 'performers')
    .addSelect('song.genre', 'genre')
    .addSelect('song.mood', 'mood')
    .addSelect('song.language', 'language')
    .addSelect('song.lyrics', 'lyrics')
    .addSelect('song.seconds', 'seconds')
    .addSelect('song.duration', 'duration')
    .addSelect('song.bitrate', 'bitrate')
    .addSelect('song.frequency', 'frequency')
    .addSelect('song.vbr', 'vbr')
    .addSelect('song.favorite', 'favorite')
    .addSelect('song.live', 'live')
    .addSelect('song.explicit', 'explicit')
    .addSelect('song.addDate', 'addDate')
    .addSelect('song.playDate', 'playDate')
    .addSelect('album.name', 'primaryAlbumName')
    .addSelect('artist.id', 'primaryArtistId')
    .addSelect('artist.name', 'primaryArtistName')
    .addSelect('artist.artistStylized', 'primaryArtistStylized')
})
export class PlaylistSongViewEntity extends SongViewBaseEntity implements IPlaylistSongModel {
  @ViewColumn()
  sequence: number;
  @ViewColumn()
  playlistId: string;
  @ViewColumn()
  songId: string;
}
