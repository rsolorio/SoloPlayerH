import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { IListItemModel } from '../../models/base-model.interface';
import { IListBroadcastService } from '../../models/list-broadcast-service-base.class';
import { IQueryModel } from '../../models/pagination-model.interface';

export interface IListBaseModel {
  listUpdatedEvent: string;
  itemMenuList: IMenuModel[];
  queryModel: IQueryModel<IListItemModel>;
  /** Overrides the logic that determines the backdrop icon for a list item. */
  getBackdropIcon?: (item: IListItemModel) => string;
  showModal?: boolean;
  title?: string;
  leftIcon?: string;
  breadcrumbsEnabled: boolean;
  broadcastService?: IListBroadcastService;
}
