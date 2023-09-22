import { IIconAction } from './core.interface';

export interface IMenuModel extends IIconAction {
    id?: string;
    caption?: string;
    subtitle?: string;
    badge?: string;
    active?: boolean;
    disabled?: boolean;
    isNew?: boolean;
    isSeparator?: boolean;
    route?: string;
    data?: any;
    items?: IMenuModel[];
    running?: boolean;
}
