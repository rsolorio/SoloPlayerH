import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongBaseEntity } from './song-base.entity';
import { SongEntity } from './song.entity';

/**
 * Field list: id, primaryAlbumId, primaryArtistId, name, filePath, titleSort, playCount, releaseYear, trackNumber, mediaNumber, seconds, favorite, bitrate, vbr, lyrics, primaryAlbumName, primaryArtistName, primaryArtistStylized
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
    .addSelect('song.filePath', 'filePath')
    .addSelect('song.titleSort', 'titleSort')
    .addSelect('song.playCount', 'playCount')
    .addSelect('song.releaseYear', 'releaseYear')
    .addSelect('song.trackNumber', 'trackNumber')
    .addSelect('song.mediaNumber', 'mediaNumber')
    .addSelect('song.seconds', 'seconds')
    .addSelect('song.favorite', 'favorite')
    .addSelect('song.bitrate', 'bitrate')
    .addSelect('song.vbr', 'vbr')
    .addSelect('song.lyrics', 'lyrics')
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
  filePath: string;
  @ViewColumn()
  playCount: number;
  @ViewColumn()
  releaseYear: number;
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
  seconds: number;
  @ViewColumn()
  bitrate: number;
  @ViewColumn()
  vbr: boolean;
  @ViewColumn()
  lyrics: string;

  // Empty properties from ISongModel interface
  classificationId: string;
}
