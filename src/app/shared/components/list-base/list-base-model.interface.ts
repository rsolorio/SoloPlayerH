import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { IListItemModel } from '../../models/base-model.interface';
import { IListBroadcastService } from '../../models/list-broadcast-service-base.class';
import { ICriteriaResult } from '../../services/criteria/criteria.interface';
import { IIconAction } from 'src/app/core/models/core.interface';
import { INavbarModel } from 'src/app/core/components/nav-bar/nav-bar-model.interface';

export interface IListBaseModel {
  /** The event to subscribe to in order to determine when the data needs to be loaded. */
  listUpdatedEvent: string;
  /** The list of menu options for each item. */
  itemMenuList: IMenuModel[];
  /** This property is populated with the response of the event. */
  criteriaResult: ICriteriaResult<IListItemModel>;
  /** Whether or not the modal dialog should be displayed. */
  showModal?: boolean;
  /** Title text for the nav bar. */
  title?: string;
  /** Icon for the inner left side of the nav bar. */
  leftIcon?: IIconAction;
  /** List of icons for the inner right side of the nav bar. */
  rightIcons?: IIconAction[];
  /** If the back button of the nav bar should be hidden. */
  backHidden?: boolean;
  /** If true, the nav bar will display the breadcrumb component. */
  breadcrumbsEnabled: boolean;
  /** The service used to search and load data. */
  broadcastService?: IListBroadcastService;
  /** Overrides the logic that determines the info to display after the list is updated. */
  getDisplayInfo?: (model: IListBaseModel) => string;
  /** Helper method that can be used to apply any logic to the item before it is marked for rendering. */
  prepareItemRender?: (item: IListItemModel) => void;
  /** Helper method that runs after the navbar mode has changed by this component. Useful to customize visible icons in the navbar. */
  onNavbarModeChanged?: (model: IListBaseModel, navbar: INavbarModel) => void;
}
