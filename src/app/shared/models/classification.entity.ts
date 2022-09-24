import { Column, Entity } from 'typeorm';
import { IdNameEntity } from './base.entity';

@Entity({name: 'classification'})
export class ClassificationEntity extends IdNameEntity {
  @Column()
  classificationType: string;
}
