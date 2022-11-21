import { BaseEntity, PrimaryColumn, Entity } from 'typeorm';

/**
 * OBSOLETE. This entity is automatically created by Song entity.
 */
@Entity({name: 'songClassification'})
export class SongClassificationEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  classificationId: string;
}
