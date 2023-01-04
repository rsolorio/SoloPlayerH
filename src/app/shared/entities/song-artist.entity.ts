import { BaseEntity, PrimaryColumn, Entity, Relation, ManyToOne } from 'typeorm';
import { ArtistEntity } from './artist.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'songArtist'})
export class SongArtistEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  artistId: string;

  @PrimaryColumn()
  artistRoleTypeId: number;

  @ManyToOne(() => ArtistEntity, artist => artist.songArtists)
  artist: Relation<ArtistEntity>;

  @ManyToOne(() => SongEntity, song => song.songArtists)
  song: Relation<SongEntity>;
}
