import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongBaseEntity } from './song-base.entity';
import { SongEntity } from './song.entity';

/**
 * Field list: id, primaryAlbumId, primaryArtistId, name, hash, filePath, titleSort, playCount, releaseYear, releaseDecade,
 * trackNumber, mediaNumber, seconds, rating, language, mood, favorite, bitrate, vbr, lyrics, primaryAlbumName, primaryArtistName, primaryArtistStylized
 */
@ViewEntity({
  name: 'songView',
  expression: ds => ds
    .createQueryBuilder(SongEntity, 'song')
    .innerJoin('song.primaryAlbum', 'album')
    .innerJoin('album.primaryArtist', 'artist')
    .select('song.id', 'id')
    .addSelect('album.id', 'primaryAlbumId')
    .addSelect('artist.id', 'primaryArtistId')
    .addSelect('song.name', 'name')
    .addSelect('song.hash', 'hash')
    .addSelect('song.filePath', 'filePath')
    .addSelect('song.fileSize', 'fileSize')
    .addSelect('song.titleSort', 'titleSort')
    .addSelect('song.playCount', 'playCount')
    .addSelect('song.releaseYear', 'releaseYear')
    .addSelect('song.releaseDecade', 'releaseDecade')
    .addSelect('song.genre', 'genre')
    .addSelect('song.trackNumber', 'trackNumber')
    .addSelect('song.mediaNumber', 'mediaNumber')
    .addSelect('song.seconds', 'seconds')
    .addSelect('song.duration', 'duration')
    .addSelect('song.rating', 'rating')
    .addSelect('song.language', 'language')
    .addSelect('song.mood', 'mood')
    .addSelect('song.favorite', 'favorite')
    .addSelect('song.live', 'live')
    .addSelect('song.bitrate', 'bitrate')
    .addSelect('song.vbr', 'vbr')
    .addSelect('song.frequency', 'frequency')
    .addSelect('song.lyrics', 'lyrics')
    .addSelect('song.addDate', 'addDate')
    .addSelect('song.playDate', 'playDate')
    .addSelect('album.name', 'primaryAlbumName')
    .addSelect('artist.name', 'primaryArtistName')
    .addSelect('artist.artistStylized', 'primaryArtistStylized')
})
export class SongViewEntity extends SongBaseEntity implements ISongModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  hash: string;
  @ViewColumn()
  filePath: string;
  @ViewColumn()
  fileSize: number;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  releaseYear: number;
  @ViewColumn()
  releaseDecade: number;
  @ViewColumn()
  genre: string;
  @ViewColumn()
  trackNumber: number;
  @ViewColumn()
  mediaNumber: number;
  @ViewColumn()
  primaryAlbumName: string;
  @ViewColumn()
  primaryArtistName: string;
  @ViewColumn()
  primaryArtistStylized: string;
  @ViewColumn()
  titleSort: string;
  @ViewColumn()
  primaryAlbumId: string;
  @ViewColumn()
  primaryArtistId: string;
  @ViewColumn()
  favorite: boolean;
  @ViewColumn()
  live: boolean;
  @ViewColumn()
  seconds: number;
  @ViewColumn()
  duration: string;
  @ViewColumn()
  rating: number;
  @ViewColumn()
  language: string;
  @ViewColumn()
  mood: string;
  @ViewColumn()
  bitrate: number;
  @ViewColumn()
  vbr: boolean;
  @ViewColumn()
  frequency: number;
  @ViewColumn()
  lyrics: string;
  @ViewColumn()
  addDate: Date;
  @ViewColumn()
  playDate: Date;

  // Empty properties from ISongModel interface
  classificationId: string;
}
