import { BaseEntity, PrimaryColumn, Entity } from 'typeorm';

/**
 * OBSOLETE. Use PartyRelationEntity instead.
 */
@Entity({name: 'songArtist'})
export class SongArtistEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  artistId: string;

  @PrimaryColumn()
  artistRoleTypeId: number;
}
