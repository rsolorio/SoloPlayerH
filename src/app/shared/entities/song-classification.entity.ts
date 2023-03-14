import { BaseEntity, PrimaryColumn, Entity, Relation, ManyToOne, Column } from 'typeorm';
import { SongEntity } from './song.entity';

@Entity({name: 'songClassification'})
export class SongClassificationEntity extends BaseEntity {
  @PrimaryColumn()
  songId: string;

  @PrimaryColumn()
  classificationId: string;

  @Column()
  primary: boolean;

  @ManyToOne(() => SongEntity, song => song.songClassifications)
  song: Relation<SongEntity>;
}
