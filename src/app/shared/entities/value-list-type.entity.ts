import { Column, Entity } from 'typeorm';
import { ListItemEntity } from './base.entity';

@Entity({name: 'valueListType'})
export class ValueListTypeEntity extends ListItemEntity {
  @Column({ nullable: true })
  description: string;
  @Column({ nullable: true })
  icon: string;
  @Column()
  system: boolean;
}
