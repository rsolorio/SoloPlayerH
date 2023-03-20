import { Column, Entity } from 'typeorm';
import { ListItemEntity } from './base.entity';

@Entity({name: 'valueListEntry'})
export class ValueListEntryEntity extends ListItemEntity {
  @Column()
  valueListTypeId: string;
  @Column({ nullable: true })
  description: string;
  @Column({ nullable: true })
  icons: string;
  @Column()
  sequence: number;
  @Column()
  isClassification: boolean;
}
