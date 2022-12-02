import { ViewColumn, ViewEntity } from 'typeorm';
import { IPlaylistSongModel } from '../models/playlist-song-model.interface';
import { PlaylistSongEntity } from './playlist-song.entity';
import { PlaylistEntity } from './playlist.entity';
import { SongBaseEntity } from './song-base.entity';
import { SongEntity } from './song.entity';

/**
 * Field list: playlistId, sequence, songId, name, filePath, seconds, playCount, favorite, albumName, artistName
 */
//  @ViewEntity({
//   expression: ds => ds
//     .createQueryBuilder(PlaylistSongEntity, 'playlistSong')
//     .select('playlistSong.playlistId', 'playlistId')
//     .addSelect('playlistSong.sequence', 'sequence')
//     .addSelect('song.id', 'id')
//     .addSelect('song.name', 'name')
//     .addSelect('song.filePath', 'filePath')
//     .addSelect('song.seconds', 'seconds')
//     .addSelect('song.playCount', 'playCount')
//     .addSelect('song.favorite', 'favorite')
//     .addSelect('album.name', 'albumName')
//     .addSelect('artist.name', 'artistName')
//     .innerJoin('song', 'song', 'playlistSong.songId = song.id')
//     .innerJoin('album', 'album', 'song.primaryAlbumId = album.id')
//     .innerJoin('artist', 'artist', 'album.primaryArtistId = artist.id')
// })
@ViewEntity({
  expression: ds => ds
    .createQueryBuilder(PlaylistSongEntity, 'playlistSong')
    .innerJoinAndSelect('playlistSong.song', 'song')
    .innerJoinAndSelect('song.primaryAlbum', 'album')
    .innerJoinAndSelect('album.primaryArtist', 'artist')
})
export class PlaylistSongViewEntity extends SongBaseEntity implements IPlaylistSongModel {
  @ViewColumn()
  sequence: number;

  playlistId: string;
  songId: string;

  song: SongEntity;
  playlist: PlaylistEntity;
}
