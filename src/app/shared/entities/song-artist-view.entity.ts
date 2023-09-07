import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongViewBaseEntity } from './song-view-base.entity';
import { PartyRelationType } from '../models/music.enum';

/**
 * This view combines the song entity with the PartyRelation entity.
 * It only considers songs where the Artist is the primary or featuring.
 * It can be used to determine which artists are related with a particular song filtering by id (songId).
 * It can be used to get all the songs associated with one artist filtering by artistId.
 * However, it cannot be used with multiple artists since it will not return unique song rows
 * since the artistId column is part of the query and it causes the song rows to be duplicated;
 * for instance, if two artists are associated with one song, you will get two song rows.
 * Fields: id, name, hash, filePath, playCount, releaseYear, trackNumber, mediaNumber, seconds, favorite, live, explicit, performers,
 * rating, mood, language, lyrics, primaryAlbumName, primaryArtistName, primaryArtistStylized,
 * titleSort, primaryAlbumId, primaryArtistId, artistId
 * TODO: use standard typeorm syntax to create query, example: PlaylistSongViewEntity
 */
 @ViewEntity({
  name: 'songArtistView',
  expression: `
  SELECT song.id, song.name, song.hash,
  song.primaryAlbumId, song.filePath, song.fileSize,
  song.trackNumber, song.mediaNumber, song.releaseYear, song.releaseDecade, song.rating, song.playCount,
  song.performers, song.genre, song.mood, song.language, song.lyrics,
  song.seconds, song.duration, song.bitrate, song.frequency, song.vbr,
  song.favorite, song.live, song.explicit, song.addDate, song.playDate,
  album.name AS primaryAlbumName, album.primaryArtistId AS primaryArtistId, artist.name AS primaryArtistName, artist.artistStylized AS primaryArtistStylized,
  partyRelation.relatedId AS artistId
  FROM song
  INNER JOIN album
  ON song.primaryAlbumId = album.id
  INNER JOIN artist
  ON album.primaryArtistId = artist.id
  INNER JOIN partyRelation
  ON song.id = partyRelation.songId
  WHERE partyRelation.relationTypeId = '${PartyRelationType.Primary}' OR partyRelation.relationTypeId = '${PartyRelationType.Featuring}'
`
})
export class SongArtistViewEntity extends SongViewBaseEntity implements ISongModel {
  @ViewColumn()
  artistId: string;
}
