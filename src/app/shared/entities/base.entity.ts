import { BaseEntity, PrimaryColumn, Column } from 'typeorm';
import { IDbModel, IListItemModel } from '../models/base-model.interface';

export class DbEntity extends BaseEntity implements IDbModel {
  @PrimaryColumn()
  id: string;
  @Column()
  name: string;

  /** Determines if the entity needs to be updated. */
  hasChanges?: boolean;
  /** Determines if the entity needs to be inserted. */
  isNew?: boolean;
}

export class ListItemEntity extends DbEntity implements IListItemModel {
  canBeRendered: boolean;
  imageSrc: string;
  selected: boolean;
}