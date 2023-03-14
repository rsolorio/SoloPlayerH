import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { ListItemEntity } from './base.entity';

@Entity({name: 'valueListType'})
export class ValueListTypeEntity extends ListItemEntity {
  @Column({ nullable: true })
  description: string;
  @Column()
  system: boolean;
}
