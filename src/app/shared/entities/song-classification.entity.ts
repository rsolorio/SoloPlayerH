import { BaseEntity, PrimaryColumn, Entity, Column } from 'typeorm';

@Entity({name: 'songClassification'})
export class SongClassificationEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  classificationId: string;

  @Column()
  primary: boolean;
}
