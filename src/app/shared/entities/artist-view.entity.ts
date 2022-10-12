import { ViewColumn, ViewEntity } from 'typeorm';
import { IArtistModel } from '../models/artist-model.interface';
import { ArtistEntity } from './artist.entity';

@ViewEntity({
  expression: ds => ds
    .createQueryBuilder(ArtistEntity, 'artist')
    .innerJoin('artist.albums', 'album')
    .innerJoin('album.songs', 'song')
    .select('artist.id', 'id')
    .addSelect('artist.name', 'name')
    .addSelect('COUNT(artist.name)', 'songCount')
    .groupBy('artist.name')
})
export class ArtistViewEntity implements IArtistModel {
  @ViewColumn()
  id: string;
  @ViewColumn()
  name: string;
  artistType: string;
  country: string;
  favorite: boolean;
  albumCount: number;
  @ViewColumn()
  songCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
