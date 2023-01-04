import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { IClassificationModel } from '../models/classification-model.interface';
import { ListItemEntity } from './base.entity';
import { SongClassificationEntity } from './song-classification.entity';

@Entity({name: 'classification'})
export class ClassificationEntity extends ListItemEntity implements IClassificationModel {
  @Column()
  classificationType: string;

  @OneToMany(() => SongClassificationEntity, songClassification => songClassification.classification)
  songClassifications: Relation<SongClassificationEntity[]>;

  songCount: number;
}
