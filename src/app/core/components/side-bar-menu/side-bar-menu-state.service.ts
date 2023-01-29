import { Injectable } from '@angular/core';

import { IMenuModel } from '../../models/menu-model.interface';
import { ISideBarMenuModel } from './side-bar-menu-model.interface';
import { UtilityService } from '../../services/utility/utility.service';
import { EventsService } from '../../services/events/events.service';
import { CoreEvent } from '../../services/events/events.enum';
import { appRoutes } from 'src/app/app-routes';

@Injectable({
  providedIn: 'root'
})
export class SideBarMenuStateService {
  private state: ISideBarMenuModel = {
    items: [],
    appMenuLoaded: false,
    loginMenuLoaded: false
  };

  constructor(private events: EventsService, private utility: UtilityService) {
  }

  public getState(): ISideBarMenuModel {
    return this.state;
  }

  private createMenuItem(caption: string, icon: string, active: boolean, badge?: string, route?: string): IMenuModel {
    const menuModel: IMenuModel = {
      caption,
      icon,
      active,
      badge,
      route,
      isSeparator: false,
      action: menuItem => {
        if (route) {
          this.events.broadcast(CoreEvent.SidebarMenuAction, menuItem);
        }
      }
    };
    return menuModel;
  }

  private createAboutMenuItem(): IMenuModel {
    const menuModel = this.createMenuItem('About', 'mdi-owl mdi', false);
    menuModel.subtitle = this.utility.getAppVersion();
    return menuModel;
  }

  private clear(): void {
    this.state.items = [];
  }

  /**
   * Populates the menu based on the specified route.
   * @param route The current route
   */
  public populateMenuByRoute(route: string): void {
    this.populateAppMenu();
  }

  /**
   * Styles the menus as active or inactive based on the specified route.
   * @param route The current route
   */
  public activateByRoute(route: string): void {
    for (const menu of this.state.items) {
      if (menu.route && menu.route === route) {
        menu.active = true;
      }
      else {
        menu.active = false;
      }
    }
  }

  private populateAppMenu(): void {
    if (!this.state.appMenuLoaded) {
      if (this.state.loginMenuLoaded) {
        this.clear();
        this.state.loginMenuLoaded = false;
      }

      for (const key of Object.keys(appRoutes)) {
        const routeInfo = appRoutes[key];
        if (!routeInfo.menuHidden) {
          this.state.items.push(this.createMenuItem(routeInfo.name, routeInfo.icon, false, null, routeInfo.route));
        }
      }

      this.state.items.push(this.createAboutMenuItem());
      this.state.appMenuLoaded = true;
    }
  }
}
