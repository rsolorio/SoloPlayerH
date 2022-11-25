import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ListEntity } from './base.entity';

/**
 * Fields: id, name, artistSort, albumCount, songCount
 */
@ViewEntity({
  expression: `
  SELECT artist.id, artist.name, artist.artistSort, COUNT(album.id) AS albumCount, SUM(album.songCount) as songCount
  FROM artist INNER JOIN (
    SELECT album.id, album.primaryArtistId, album.name, album.releaseYear, COUNT(song.id) AS songCount
    FROM album INNER JOIN song ON album.id = song.primaryAlbumId
    GROUP BY album.id, album.primaryArtistId, album.name, album.releaseYear
  ) AS album ON artist.id = album.primaryArtistId
  GROUP BY artist.id, artist.name
`
})
export class AlbumArtistViewEntity extends ListEntity implements IArtistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  albumCount: number;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  artistSort: string;

  artistType: string;
  country: string;
  favorite: boolean;
}
