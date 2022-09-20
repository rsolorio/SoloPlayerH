import { IMenuModel } from '../../models/menu-model.interface';

export interface ISideBarMenuModel {
    items: IMenuModel[];
    appMenuLoaded: boolean;
    loginMenuLoaded: boolean;
}
