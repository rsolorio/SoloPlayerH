import { Column, Entity, ManyToMany, Relation } from 'typeorm';
import { IClassificationModel } from '../models/classification-model.interface';
import { ListItemEntity } from './base.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'classification'})
export class ClassificationEntity extends ListItemEntity implements IClassificationModel {
  @Column()
  classificationType: string;

  @ManyToMany(() => SongEntity, song => song.classifications)
  songs: Relation<SongEntity[]>;

  songCount: number;
}
