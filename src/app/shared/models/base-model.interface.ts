import { IIcon, IImage, ISelectable } from 'src/app/core/models/core.interface';

export interface IDbModel extends ISelectable {
  id: string;
  name: string;
}

export interface IListItemModel extends IDbModel {
  recentIcon?: IIcon;
  image: IImage;
  canBeRendered: boolean;
}
