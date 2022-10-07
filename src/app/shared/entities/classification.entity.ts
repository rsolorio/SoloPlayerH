import { Column, Entity, ManyToMany, Relation } from 'typeorm';
import { DbEntity } from './base.entity';
import { SongEntity } from './song.entity';

@Entity({name: 'classification'})
export class ClassificationEntity extends DbEntity {
  @Column()
  classificationType: string;

  @ManyToMany(() => SongEntity, song => song.classifications)
  songs: Relation<SongEntity[]>;
}
