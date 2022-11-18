import { Injectable, ViewContainerRef, ComponentFactoryResolver, Type } from '@angular/core';
import { INavbarModel, NavbarDisplayMode } from './nav-bar-model.interface';
import { IMenuModel } from '../../models/menu-model.interface';
import { IIconAction } from '../../models/core.interface';
import { IIconMenuModel } from '../icon-menu/icon-menu-model.interface';
import { NavBarComponent } from './nav-bar.component';

@Injectable({
  providedIn: 'root'
})
export class NavBarStateService {
  private navbarState: INavbarModel = {
    show: true,
    menuList: [],
    mode: NavbarDisplayMode.None
  };
  private navbarComponent: NavBarComponent;
  private componentInstance;
  private componentContainer: ViewContainerRef;
  /** Number of seconds the toast message will be displayed. */
  private toastDuration = 3;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  public getState(): INavbarModel {
    return this.navbarState;
  }

  public show(): void {
    if (!this.navbarState.show) {
      this.navbarState.show = true;
    }
  }

  public hide(): void {
    if (this.navbarState.show) {
      this.navbarState.show = false;
    }
  }

  /** Builds the menu of the navbar. */
  public buildMenu(menuList?: IMenuModel[]): void {
    this.navbarState.menuList = [];
    if (menuList) {
      for (const menuItem of menuList) {
        this.navbarState.menuList.push(menuItem);
      }
    }
  }

  /**
   * Saves the container that hosts the component to display.
   * @param viewContainer The ViewContainerRef that hosts the component to display in the nav bar.
   */
  public saveComponentContainer(viewContainer: ViewContainerRef): void {
    this.componentContainer = viewContainer;
  }

  public loadComponent(componentType?: Type<any>, model?: any): void {
    this.componentContainer.clear();
    this.componentInstance = undefined;
    this.navbarState.componentType = componentType;
    if (componentType) {
      this.navbarState.title = null;
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);
      const component = this.componentContainer.createComponent(componentFactory);
      this.componentInstance = component.instance;
      if (model) {
        this.componentInstance.model = model;
      }
      // this.navbarState.componentType = componentType;
    }
  }

  public set(navbarModel: INavbarModel): void {
    this.navbarState.mode = navbarModel.mode;
    this.navbarState.title = navbarModel.title;
    this.loadComponent(navbarModel.componentType);
    this.navbarState.discardPlaceholder = navbarModel.discardPlaceholder;
    this.buildMenu(navbarModel.menuList);
    this.setIcons(navbarModel.leftIcon, navbarModel.rightIcon, navbarModel.leftIconMenu, navbarModel.rightIconMenu);
  }

  /**
   * Clears the menu list and removes the component from the nav bar.
   */
  public clear(): void {
    this.navbarState.menuList = [];
    this.componentContainer.clear();
    this.componentInstance = undefined;
  }

  public setIcons(leftIcon?: IIconAction, rightIcon?: IIconAction, leftIconMenu?: IIconMenuModel, rightIconMenu?: IIconMenuModel): void {
    this.navbarState.leftIcon = leftIcon;
    this.navbarState.rightIcon = rightIcon;
    this.navbarState.leftIconMenu = leftIconMenu;
    this.navbarState.rightIconMenu = rightIconMenu;
  }

  public getComponentInstance<T>(): T {
    return this.componentInstance as T;
  }

  public showToast(message: string): void {
    this.navbarState.toastMessage = message;
    this.navbarState.toastVisible = true;
    setTimeout(() => {
      this.hideToast();
    }, 1000 * this.toastDuration);
  }

  private hideToast(): void {
    this.navbarState.toastVisible = false;
    // Remove the message so the element is removed from the DOM
    setTimeout(() => {
      this.navbarState.toastMessage = null;
    }, 1000); // This time has to be equals or less than the time to fade out
  }

  public register(navbar: NavBarComponent): void {
    this.navbarComponent = navbar;
  }

  public searchBoxFocus(): void {
    if (this.navbarComponent) {
      this.navbarComponent.searchBoxFocus();
    }
  }
}
