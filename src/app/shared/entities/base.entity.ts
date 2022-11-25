import { BaseEntity, PrimaryColumn, Column } from 'typeorm';
import { IDbModel, IListModel } from '../models/base-model.interface';

export class DbEntity extends BaseEntity implements IDbModel {
  @PrimaryColumn()
  id: string;
  @Column()
  name: string;
}

export class ListEntity extends DbEntity implements IListModel {
  canBeRendered: boolean;
  imageSrc: string;
  selected: boolean;
}