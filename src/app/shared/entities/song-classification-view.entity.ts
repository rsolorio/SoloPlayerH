import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongViewBaseEntity } from './song-view-base.entity';

/**
 * This view combines the song entity with the songClassification entity.
 * Fields: id, name, hash, filePath, playCount, releaseYear, releaseDecade,
 * trackNumber, mediaNumber, seconds, favorite, live, explicit, performers, rating, mood, language,
 * lyrics, primaryAlbumName, primaryArtistName, primaryArtistStylized,
 * titleSort, primaryAlbumId, primaryArtistId, classificationId
 */
 @ViewEntity({
  name: 'songClassificationView',
  expression: `
  SELECT song.id, song.name, song.hash,
  song.primaryAlbumId, song.filePath, song.fileSize,
  song.trackNumber, song.mediaNumber, song.releaseYear, song.releaseDecade, song.rating, song.playCount,
  song.performers, song.genre, song.mood, song.language, song.lyrics,
  song.seconds, song.duration, song.bitrate, song.frequency, song.vbr,
  song.favorite, song.live, song.explicit, song.addDate, song.playDate,
  album.name AS primaryAlbumName, album.primaryArtistId AS primaryArtistId, artist.name AS primaryArtistName, artist.artistStylized AS primaryArtistStylized,
  songClassification.classificationId AS classificationId
  FROM song
  INNER JOIN album
  ON song.primaryAlbumId = album.id
  INNER JOIN artist
  ON album.primaryArtistId = artist.id
  INNER JOIN songClassification
  ON song.id = songClassification.songId
`
})
export class SongClassificationViewEntity extends SongViewBaseEntity implements ISongModel {
  @ViewColumn()
  classificationId: string;
}
