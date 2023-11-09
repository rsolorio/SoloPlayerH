import { ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ArtistViewBaseEntity } from './artist-view-base.entity';

/**
 * Fields: id, name, hash, artistSort, artistStylized, artistType, country, favorite, albumCount, songCount, playCount, seconds, songAddDateMax
 */
@ViewEntity({
  name: 'albumArtistView',
  expression: `
  SELECT artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.artistType, artist.country, artist.favorite,
  COUNT(album.id) AS albumCount, SUM(album.songCount) AS songCount, SUM(album.playCount) AS playCount, SUM(album.seconds) AS seconds, MAX(album.songAddDateMax) AS songAddDateMax
  FROM artist
  INNER JOIN (
    SELECT album.id, album.primaryArtistId, album.name, COUNT(song.id) AS songCount, SUM(song.playCount) AS playCount, SUM(song.seconds) AS seconds, MAX(song.addDate) AS songAddDateMax
    FROM album INNER JOIN song
    ON album.id = song.primaryAlbumId
    GROUP BY album.id, album.primaryArtistId, album.name
  ) AS album ON artist.id = album.primaryArtistId
  GROUP BY artist.id, artist.name, artist.hash, artist.artistSort, artist.artistStylized, artist.artistType, artist.artistGender, artist.country, artist.favorite
`
})
export class AlbumArtistViewEntity extends ArtistViewBaseEntity implements IArtistModel {
}
