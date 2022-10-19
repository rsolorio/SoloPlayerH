import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { IListModel } from '../../models/base-model.interface';
import { IPaginationModel } from '../../models/pagination-model.interface';

export interface IListBaseModel {
  listUpdatedEvent: string;
  itemMenuList: IMenuModel[];
  navbarMenuList: IMenuModel[];
  paginationModel: IPaginationModel<IListModel>;
  setItemImage?: (item: IListModel) => void;
}
