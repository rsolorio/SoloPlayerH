import { IImage } from 'src/app/core/models/core.interface';
import { BaseEntity, PrimaryColumn, Column } from 'typeorm';
import { IDbModel, IListItemModel } from '../models/base-model.interface';
import { ITransitionImageModel } from 'src/app/related-image/transition-image/transition-image-model.interface';
import { RelatedImageSrc } from '../services/database/database.images';

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
  canBeRendered = false;
  image: ITransitionImageModel = {
    defaultSrc: RelatedImageSrc.DefaultSmall
  };
  selected = false;
}