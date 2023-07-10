import { BaseEntity, PrimaryColumn, Column } from 'typeorm';
import { IDbModel, IListItemModel } from '../models/base-model.interface';
import { ITransitionImageModel } from 'src/app/related-image/transition-image/transition-image-model.interface';
import { RelatedImageSrc } from '../services/database/database.images';

export class DbEntity extends BaseEntity implements IDbModel {
  @PrimaryColumn({ comment: 'Unique identifier.' })
  id: string;
  @Column({ comment: 'Human readable value that identifies this record.' })
  name: string;
  @Column({ comment: 'A value that makes this record unique amongst all its siblings and used to find/compare records. Do not confuse this value with the id; the hash is not globally unique.' })
  hash: string;

  /** Determines if the entity needs to be updated. */
  hasChanges?: boolean;
  /** Determines if the entity needs to be inserted. */
  isNew?: boolean;
}

export class ListItemEntity extends DbEntity implements IListItemModel {
  canBeRendered = false;
  image: ITransitionImageModel = {
    defaultSrc: RelatedImageSrc.DefaultSmall
  };
  selected = false;
}