import { BaseEntity, PrimaryColumn, Entity } from 'typeorm';

@Entity({name: 'songArtist'})
export class SongArtistEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  artistId: string;
}
