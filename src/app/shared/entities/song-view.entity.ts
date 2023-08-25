import { ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongEntity } from './song.entity';
import { SongViewBaseEntity } from './song-view-base.entity';

/**
 * Field list: id, primaryAlbumId, primaryArtistId, name, hash, filePath, titleSort, playCount, releaseYear, releaseDecade,
 * trackNumber, mediaNumber, seconds, rating, language, mood, favorite, live, explicit, performers, bitrate, vbr, lyrics, primaryAlbumName, primaryArtistName, primaryArtistStylized
 */
@ViewEntity({
  name: 'songView',
  expression: ds => ds
    .createQueryBuilder(SongEntity, 'song')
    .innerJoin('album', 'album', 'song.primaryAlbumId = album.id')
    .innerJoin('artist', 'artist', 'album.primaryArtistId = artist.id')
    .select('song.id', 'id')
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
export class SongViewEntity extends SongViewBaseEntity implements ISongModel {
}
