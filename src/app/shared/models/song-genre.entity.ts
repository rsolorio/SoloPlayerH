import { BaseEntity, PrimaryColumn, Entity } from 'typeorm';

@Entity({name: 'songGenre'})
export class SongGenreEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  genreId: string;
}
