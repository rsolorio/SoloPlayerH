import { IIcon } from '../../models/core.interface';
import { IMenuModel } from '../../models/menu-model.interface';

/** The model of the icon-menu component. */
export interface IIconMenuModel extends IIcon {
    /** The list of menu items. */
    items: IMenuModel[];
    /** Determines the height of the menu in terms of number of menu items. */
    visibleItemCount?: number;
    /** Any information that will be passed through the fired action. */
    context?: any;
}
