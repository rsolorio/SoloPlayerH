import { BaseEntity, PrimaryColumn, Entity } from 'typeorm';

@Entity({name: 'songClassification'})
export class SongClassificationEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  classificationId: string;
}
