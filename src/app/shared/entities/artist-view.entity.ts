import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ArtistEntity } from './artist.entity';

@ViewEntity({
  expression: ds => ds
    .createQueryBuilder(ArtistEntity, 'artist')
    .innerJoin('artist.songs', 'song')
    .select('artist.id', 'id')
    .addSelect('artist.name', 'name')
    .addSelect('artist.artistSort', 'artistSort')
    .addSelect('COUNT(artist.id)', 'songCount')
    .groupBy('artist.id')
})
export class ArtistViewEntity implements IArtistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  @ViewColumn()
  songCount: number;
  @ViewColumn()
  artistSort: string;

  artistType: string;
  country: string;
  favorite: boolean;
  albumCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
