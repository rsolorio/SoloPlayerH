import { BaseEntity, PrimaryColumn, Entity, Column } from 'typeorm';

@Entity({name: 'songClassification'})
export class SongClassificationEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;
  @PrimaryColumn()
  classificationId: string;
  @Column({ comment: 'The classification table already has this field, but including it here to prevent doing a join with that table when looking for classifications of a certain type.'})
  classificationTypeId: string;
  @Column({ comment: 'Not currently being used. The concept is to define a primary classification for a given song and classification type.' })
  primary: boolean;
}
