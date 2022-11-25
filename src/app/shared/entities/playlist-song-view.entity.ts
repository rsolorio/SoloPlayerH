import { ViewColumn, ViewEntity } from 'typeorm';
import { PlayerSongStatus } from '../models/player.enum';
import { IPlaylistSongModel } from '../models/playlist-song-model.interface';
import { PlaylistSongEntity } from './playlist-song.entity';
import { SongBaseEntity } from './song-base.entity';

/**
 * Field list: playlistId, sequence, songId, name, filePath, seconds, playCount, favorite, albumName, artistName
 */
 @ViewEntity({
  expression: ds => ds
    .createQueryBuilder(PlaylistSongEntity, 'playlistSong')
    .select('playlistSong.playlistId', 'playlistId')
    .addSelect('playlistSong.sequence', 'sequence')
    .addSelect('song.id', 'id')
    .addSelect('song.name', 'name')
    .addSelect('song.filePath', 'filePath')
    .addSelect('song.seconds', 'seconds')
    .addSelect('song.playCount', 'playCount')
    .addSelect('song.favorite', 'favorite')
    .addSelect('album.name', 'albumName')
    .addSelect('artist.name', 'artistName')
    .innerJoin('song', 'song', 'playlistSong.songId = song.id')
    .innerJoin('album', 'album', 'song.primaryAlbumId = album.id')
    .innerJoin('artist', 'artist', 'album.primaryArtistId = artist.id')
})
export class PlaylistSongViewEntity extends SongBaseEntity implements IPlaylistSongModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  playlistId: string;
  @ViewColumn()
  sequence: number;
  @ViewColumn()
  name: string;
  @ViewColumn()
  filePath: string;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  albumName: string;
  @ViewColumn()
  artistName: string;

  playerStatus: PlayerSongStatus;
}
