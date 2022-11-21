import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { PlaylistSongEntity } from './playlist-song.entity';

/**
 * Field list: id, name, filePath, titleSort, playCount, releaseYear, trackNumber, mediaNumber, albumName, artistName, primaryAlbumId, primaryArtistId
 */
 @ViewEntity({
  expression: ds => ds
    .createQueryBuilder(PlaylistSongEntity, 'playlistSong')
    .innerJoin('song.primaryAlbum', 'album')
    .innerJoin('album.primaryArtist', 'artist')
    .select('song.id', 'id')
    .addSelect('album.id', 'primaryAlbumId')
    .addSelect('artist.id', 'primaryArtistId')
    .addSelect('song.name', 'name')
    .addSelect('song.filePath', 'filePath')
    .addSelect('song.titleSort', 'titleSort')
    .addSelect('song.playCount', 'playCount')
    .addSelect('song.releaseYear', 'releaseYear')
    .addSelect('song.trackNumber', 'trackNumber')
    .addSelect('song.mediaNumber', 'mediaNumber')
    .addSelect('album.name', 'albumName')
    .addSelect('artist.name', 'artistName')
})
export class PlaylistSongViewEntity {
}
