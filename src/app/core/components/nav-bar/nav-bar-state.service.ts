import { Injectable, ViewContainerRef, ComponentFactoryResolver, Type } from '@angular/core';
import { INavbarModel, INavBarOuterIcons, NavbarDisplayMode } from './nav-bar-model.interface';
import { IMenuModel } from '../../models/menu-model.interface';
import { NavBarComponent } from './nav-bar.component';
import { EventsService } from '../../services/events/events.service';
import { CoreEvent } from 'src/app/app-events';
import { IconActionArray } from '../../models/icon-action-array.class';
import { IEventArgs } from '../../models/core.interface';

@Injectable({
  providedIn: 'root'
})
export class NavBarStateService {
  private navbarState: INavbarModel = {
    show: true,
    menuList: [],
    mode: NavbarDisplayMode.None,
    rightIcons: new IconActionArray()
  };

  private outerIcons: INavBarOuterIcons = {};
  private navbarComponent: NavBarComponent;
  private componentInstance;
  private componentContainer: ViewContainerRef;
  /** Specified as any since the type will depend on the platform running the timeout. */
  private toastTimeout: any;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private events: EventsService) { }

  public getState(): INavbarModel {
    return this.navbarState;
  }

  public setMode(mode: NavbarDisplayMode): void {
    const args: IEventArgs<NavbarDisplayMode> = {
      oldValue: this.navbarState.mode,
      newValue: mode
    };
    this.navbarState.mode = mode;
    this.events.broadcast(CoreEvent.NavbarModeChanged, args);
  }

  public getOuterIcons(): INavBarOuterIcons {
    return this.outerIcons;
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
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);
      const component = this.componentContainer.createComponent(componentFactory);
      this.componentInstance = component.instance;
      if (model) {
        this.componentInstance.model = model;
      }
    }
  }

  public set(navbarModel: INavbarModel): void {
    this.navbarState.mode = navbarModel.mode;
    this.navbarState.title = navbarModel.title;
    this.navbarState.backHidden = navbarModel.backHidden;
    this.navbarState.onBack = navbarModel.onBack;
    this.loadComponent(navbarModel.componentType);
    this.navbarState.discardPlaceholder = navbarModel.discardPlaceholder;
    this.buildMenu(navbarModel.menuList);
    this.setIcons(navbarModel);
  }

  /**
   * Clears the menu list and removes the component from the nav bar.
   */
  public clear(): void {
    this.navbarState.menuList = [];
    this.componentContainer.clear();
    this.componentInstance = undefined;
  }

  public setIcons(navbarModel: INavbarModel): void {
    this.navbarState.leftIcon = navbarModel.leftIcon;
    this.navbarState.rightIcons = navbarModel.rightIcons;
  }

  public getComponentInstance<T>(): T {
    return this.componentInstance as T;
  }

  public enableAutoHide(): void {
    // Auto hide when scrolling down
    this.events.onEvent(CoreEvent.WindowScrollDown).subscribe(() => {
      this.hide();
    });
    // Auto show when scrolling up
    this.events.onEvent(CoreEvent.WindowScrollUp).subscribe(() => {
      this.show();
    });
  }

  public showToast(message: string): void {
    // If the toast is still in the dom remove it
    if (this.navbarState.toastMessage) {
      this.cancelToast();
      // Give a little time to render the change and display the toast again
      setTimeout(() => {
        this.fadeInToast(message);
      });
    }
    else {
      this.fadeInToast(message);
    }    
  }

  private fadeInToast(message: string): void {
    // Display the toast immediately
    this.navbarState.toastVisible = true;
    this.navbarState.toastMessage = message;
    // Give the browser a little bit of time to properly render the css
    setTimeout(() => {
      // And start to fade out slowly
      this.fadeOutToast();
    }, 10);
  }

  /**
   * It will remove the toast visible class that will cause a
   * fade out animation, and it will wait for the animation to
   * finish to clear the message.
   */
  private fadeOutToast(): void {
    // This will start the animation
    this.navbarState.toastVisible = false;
    // Save the timeout in case we want to cancel it
    this.toastTimeout = setTimeout(() => {
      // Remove the message so the element is removed from the DOM
      this.navbarState.toastMessage = null;
      // Clear the timeout
      this.toastTimeout = null;
    }, 6000); // This time has to be equals or less than the time to fade out
  }

  /**
   * It will immediately remove the toast from the DOM and clear any associated timeouts.
   */
  private cancelToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    // This will remove the element
    this.navbarState.toastMessage = null
    // This will remove the css class
    this.navbarState.toastVisible = false;
  }

  public register(navbar: NavBarComponent): void {
    this.navbarComponent = navbar;
  }

  public searchBoxFocus(): void {
    if (this.navbarComponent) {
      this.navbarComponent.searchBoxFocus();
    }
  }

  public restoreOuterLeftIcon(): void {
    this.outerIcons.left = null;
  }
}
