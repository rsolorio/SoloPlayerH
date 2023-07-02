import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'partyRelation'})
export class PartyRelationEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  relatedId: string;

  @Column({ nullable: true })
  artistId: string;

  @Column({ nullable: true })
  albumId: string;

  @Column({ nullable: true })
  songId: string;

  @Column()
  relationTypeId: string;
}
