import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ListItemEntity } from './base.entity';

/**
 * Fields: id, name, artistSort, artistStylized, albumCount, songCount
 */
@ViewEntity({
  name: 'albumArtistView',
  expression: `
  SELECT artist.id, artist.name, artist.artistSort, artist.artistStylized, COUNT(album.id) AS albumCount, SUM(album.songCount) as songCount, MAX(album.songAddDateMax) AS songAddDateMax
  FROM artist INNER JOIN (
    SELECT album.id, album.primaryArtistId, album.name, COUNT(song.id) AS songCount, MAX(song.addDate) AS songAddDateMax
    FROM album INNER JOIN song ON album.id = song.primaryAlbumId
    GROUP BY album.id, album.primaryArtistId, album.name
  ) AS album ON artist.id = album.primaryArtistId
  GROUP BY artist.id, artist.name, artist.artistSort, artist.artistStylized
`
})
export class AlbumArtistViewEntity extends ListItemEntity implements IArtistModel {
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
  @ViewColumn()
  artistStylized: string;
  @ViewColumn()
  songAddDateMax: Date;

  artistTypeId: string;
  countryId: string;
  favorite: boolean;
}
