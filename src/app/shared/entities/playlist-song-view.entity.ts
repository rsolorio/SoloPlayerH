import { ViewColumn, ViewEntity } from 'typeorm';
import { IPlaylistSongModel } from '../models/playlist-song-model.interface';
import { PlaylistSongEntity } from './playlist-song.entity';
import { SongBaseEntity } from './song-base.entity';
import { SongEntity } from './song.entity';

/**
 * OBSOLETE. Use the getTracks method which returns a list of PlaylistSong entities instead of PlaylistSongView entities.
 */
@ViewEntity({
  name: 'playlistSongView',
  expression: ds => ds
    .createQueryBuilder(PlaylistSongEntity, 'playlistSong')
    .innerJoinAndSelect('playlistSong.song', 'song')
    .innerJoinAndSelect('song.primaryAlbum', 'album')
    .innerJoinAndSelect('album.primaryArtist', 'artist')
    .addSelect('song.id', 'id')
    .addSelect('song.name', 'name')
    .addSelect('song.hash', 'hash')
    .addSelect('playlistSong.playlistId', 'playlistId')
    .addSelect('playlistSong.songId', 'songId')
    .addSelect('playlistSong.sequence', 'sequence')
})
export class PlaylistSongViewEntity extends SongBaseEntity implements IPlaylistSongModel {
  @ViewColumn()
  sequence: number;
  @ViewColumn()
  playlistId: string;
  @ViewColumn()
  songId: string;

  song: SongEntity;
}
