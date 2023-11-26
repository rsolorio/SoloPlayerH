import { Type } from '@angular/core';
import { IMenuModel } from '../../models/menu-model.interface';
import { IIconAction } from '../../models/core.interface';
import { IconActionArray } from '../../models/icon-action-array.class';

/** Interface that defines the behavior of the top nav bar of the application. */
export interface INavbarModel {
    /** Flag that determines if the nav bar should be visible or not. */
    show: boolean;
    /** List of menu items to be displayed in the ellipsis menu on the outer right of the nav bar. */
    menuList: IMenuModel[];
    /** Title text of the nav bar. */
    title?: string;
    /** Component to load inside the nav bar. */
    componentType?: Type<any>;
    /** IconAction for the inner left side of the nav bar. */
    leftIcon?: IIconAction;
    /** Mini icon displayed on the right bottom corner of the left icon */
    leftSubIcon?: string;
    /** List of IconAction elements for the inner right side of the nav bar. */
    rightIcons: IconActionArray;
    /** The message that will be displayed by the tiny toast notification below the nav bar. */
    toastMessage?: string;
    /** Show/hide the tiny toast below the nav bar. */
    toastVisible?: boolean;
    /** If true, this property will not render the place holder that pushes the content of the view below the nav bar. */
    discardPlaceholder?: boolean;
    /** Determines what should be displayed in the navbar content area. */
    mode: NavbarDisplayMode;
    /** Value bound to the search box of the nav bar. */
    searchTerm?: string;
    /** Event handler fired when the user performs a search. */
    onSearch?: (searchTerm: string) => void;
    /** Event handler fired when the user clicks the clear button. */
    onSearchClear?: () => void;
}

/**
 * Optional icons for the outer left and right icons in the navbar
 */
export interface INavBarOuterIcons {
    left?: IIconAction;
    right?: IIconAction;
}

export enum NavbarDisplayMode {
    None,
    Title,
    Component,
    Search
}