import { IIcon, ISelectable } from 'src/app/core/models/core.interface';
import { ITransitionImageModel } from 'src/app/related-image/transition-image/transition-image-model.interface';

export interface IDbModel extends ISelectable {
  id: string;
  name: string;
}

export interface IListItemModel extends IDbModel {
  recentIcon?: IIcon;
  image?: ITransitionImageModel;
  canBeRendered: boolean;
}
