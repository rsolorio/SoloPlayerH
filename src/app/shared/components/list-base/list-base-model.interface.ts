import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { IListItemModel } from '../../models/base-model.interface';
import { IListBroadcastService } from '../../models/list-broadcast-service-base.class';
import { QueryModel } from '../../models/query-model.class';

export interface IListBaseModel {
  listUpdatedEvent: string;
  itemMenuList: IMenuModel[];
  queryModel: QueryModel<IListItemModel>;
  showModal?: boolean;
  title?: string;
  leftIcon?: string;
  breadcrumbsEnabled: boolean;
  broadcastService?: IListBroadcastService;
  /** Overrides the logic that determines the backdrop icon for a list item. */
  getBackdropIcon?: (item: IListItemModel) => string;
}
