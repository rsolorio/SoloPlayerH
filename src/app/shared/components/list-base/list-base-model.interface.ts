import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { IListItemModel } from '../../models/base-model.interface';
import { IListBroadcastService } from '../../models/list-broadcast-service-base.class';
import { ICriteriaResult } from '../../services/criteria/criteria.interface';

export interface IListBaseModel {
  listUpdatedEvent: string;
  itemMenuList: IMenuModel[];
  criteriaResult: ICriteriaResult<IListItemModel>;
  showModal?: boolean;
  title?: string;
  leftIcon?: string;
  breadcrumbsEnabled: boolean;
  broadcastService?: IListBroadcastService;
  /** Overrides the logic that determines the backdrop icon for a list item. */
  getBackdropIcon?: (item: IListItemModel) => string;
}
