import { ViewColumn, ViewEntity } from 'typeorm';
import { ISongModel } from '../models/song-model.interface';
import { SongEntity } from './song.entity';

@ViewEntity({
  expression: ds => ds
    .createQueryBuilder(SongEntity, 'song')
    .innerJoin('song.primaryAlbum', 'album')
    .innerJoin('album.primaryArtist', 'artist')
    .select('song.id', 'id')
    .addSelect('song.name', 'name')
    .addSelect('song.filePath', 'filePath')
    .addSelect('song.playCount', 'playCount')
    .addSelect('song.releaseYear', 'releaseYear')
    .addSelect('album.name', 'albumName')
    .addSelect('artist.name', 'artistName')
})
export class SongViewEntity implements ISongModel {
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
  albumName: string;
  @ViewColumn()
  artistName: string;

  favorite: boolean;
  imageSrc: string;
  canBeRendered: boolean;
}
