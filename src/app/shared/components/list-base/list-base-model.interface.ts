import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { IListItemModel } from '../../models/base-model.interface';
import { IListBroadcastService } from '../../models/list-broadcast-service-base.class';
import { ICriteriaResult } from '../../services/criteria/criteria.interface';
import { IIconAction } from 'src/app/core/models/core.interface';

export interface IListBaseModel {
  /** The event to subscribe to in order to determine when the data needs to be loaded. */
  listUpdatedEvent: string;
  /** The list of menu options for each item. */
  itemMenuList: IMenuModel[];
  criteriaResult: ICriteriaResult<IListItemModel>;
  showModal?: boolean;
  /** Title text for the nav bar. */
  title?: string;
  /** Icon for the inner left side of the nav bar. */
  leftIcon?: IIconAction;
  /** Icon for the inner right side of the nav bar. */
  rightIcon?: IIconAction;
  /** If true, the nav bar will display the breadcrumb component. */
  breadcrumbsEnabled: boolean;
  /** The service used to search and load data. */
  broadcastService?: IListBroadcastService;
  /** Routine to get the icon of each item. */
  getItemIcon?: (item: IListItemModel) => IIconAction;
  /** Overrides the logic that determines the backdrop icon for a list item image. */
  getBackdropIcon?: (item: IListItemModel) => string;
  /** Overrides the logic that determines the info to display after the list is updated. */
  getDisplayInfo?: (model: IListBaseModel) => string;
  /** Helper method that can be used to apply any logic to the item before it is marked for rendering. */
  prepareItemRender?: (item: IListItemModel) => void;
}
