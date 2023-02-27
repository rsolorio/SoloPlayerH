import { IImage, ISelectable } from 'src/app/core/models/core.interface';

export interface IDbModel extends ISelectable {
  id: string;
  name: string;
}

export interface IListItemModel extends IDbModel {
  image: IImage;
  canBeRendered: boolean;
}
