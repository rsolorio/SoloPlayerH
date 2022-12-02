import { BaseEntity, PrimaryColumn, Column } from 'typeorm';
import { IDbModel, IListItemModel } from '../models/base-model.interface';

export class DbEntity extends BaseEntity implements IDbModel {
  @PrimaryColumn()
  id: string;
  @Column()
  name: string;
}

export class ListItemEntity extends DbEntity implements IListItemModel {
  canBeRendered: boolean;
  imageSrc: string;
  selected: boolean;
}