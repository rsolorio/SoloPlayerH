import { BaseEntity, PrimaryColumn, Entity } from 'typeorm';

/**
 * OBSOLETE/DEPRECATED. Use songClassification instead.
 */
@Entity({name: 'songGenre'})
export class SongGenreEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  genreId: string;
}
