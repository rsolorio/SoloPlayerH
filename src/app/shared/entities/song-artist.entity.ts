import { BaseEntity, PrimaryColumn, Entity } from 'typeorm';

/**
 * DEPRECATED. Use SongArtistViewEntity instead.
 */
@Entity({name: 'songArtist'})
export class SongArtistEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  artistId: string;
}
