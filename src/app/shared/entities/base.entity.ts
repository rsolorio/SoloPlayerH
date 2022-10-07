import { BaseEntity, PrimaryColumn, Column } from 'typeorm';
import { IDbModel } from '../models/base-model.interface';

export class DbEntity extends BaseEntity implements IDbModel {
  @PrimaryColumn()
  id: string;
  @Column()
  name: string;
}
