import { Column, Entity, ManyToMany, Relation } from 'typeorm';
import { IClassificationModel } from '../models/classification-model.interface';
import { DbEntity } from './base.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'classification'})
export class ClassificationEntity extends DbEntity implements IClassificationModel {
  @Column()
  classificationType: string;

  @ManyToMany(() => SongEntity, song => song.classifications)
  songs: Relation<SongEntity[]>;

  songCount: number;
  imageSrc: string;
  canBeRendered: boolean;
}
