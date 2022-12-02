import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { IListItemModel } from '../../models/base-model.interface';
import { IPaginationModel } from '../../models/pagination-model.interface';

export interface IListBaseModel {
  listUpdatedEvent: string;
  itemMenuList: IMenuModel[];
  paginationModel: IPaginationModel<IListItemModel>;
  getBackdropIcon: (item: IListItemModel) => string;
}
