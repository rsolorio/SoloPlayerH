import { ISelectable } from 'src/app/core/models/core.interface';

export interface IDbModel extends ISelectable {
  id: string;
  name: string;
}

export interface IListModel extends IDbModel {
  imageSrc: string;
  canBeRendered: boolean;
  selected: boolean;
}
