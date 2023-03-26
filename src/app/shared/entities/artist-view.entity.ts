import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ArtistEntity } from './artist.entity';
import { ListItemEntity } from './base.entity';

/**
 * Fields: id, name, artistSort, artistStylized, songCount
 */
@ViewEntity({
  name: 'artistView',
  expression: ds => ds
    .createQueryBuilder(ArtistEntity, 'artist')
    .innerJoin('artist.songArtists', 'songArtist')
    .innerJoin('songArtist.song', 'song')
    .select('artist.id', 'id')
    .addSelect('artist.name', 'name')
    .addSelect('artist.artistSort', 'artistSort')
    .addSelect('artist.artistStylized', 'artistStylized')
    .addSelect('COUNT(artist.id)', 'songCount')
    .addSelect('NULL', 'songAddDateMax')
    .groupBy('artist.id')
})
export class ArtistViewEntity extends ListItemEntity implements IArtistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
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
  albumCount: number;
}
