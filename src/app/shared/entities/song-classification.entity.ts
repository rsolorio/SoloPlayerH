import { BaseEntity, PrimaryColumn, Entity, Relation, ManyToOne } from 'typeorm';
import { ClassificationEntity } from './classification.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'songClassification'})
export class SongClassificationEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  classificationId: string;

  @ManyToOne(() => SongEntity, song => song.songClassifications)
  song: Relation<SongEntity>;

  @ManyToOne(() => ClassificationEntity, classification => classification.songClassifications)
  classification: Relation<ClassificationEntity>;
}
