import { Injectable } from '@angular/core';

import { IMenuModel } from '../../models/menu-model.interface';
import { ISideBarMenuModel } from './side-bar-menu-model.interface';
import { UtilityService } from '../../services/utility/utility.service';
import { EventsService } from '../../services/events/events.service';
import { AppRoute, appRoutes } from 'src/app/app-routes';
import { LogService } from '../../services/log/log.service';
import { LogLevel } from '../../services/log/log.enum';
import { AppViewIcons } from 'src/app/app-icons';
import { CoreEvent } from 'src/app/app-events';

@Injectable({
  providedIn: 'root'
})
export class SideBarMenuStateService {
  private state: ISideBarMenuModel = {
    items: [],
    appMenuLoaded: false,
    loginMenuLoaded: false
  };

  constructor(private events: EventsService, private utility: UtilityService, private log: LogService) {
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
      action: menuModel => {
        if (route) {
          this.events.broadcast(CoreEvent.SidebarMenuAction, menuModel);
        }
      }
    };
    return menuModel;
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

  public setRunning(route: AppRoute, running: boolean): void {
    const routeInfo = appRoutes[route];
    const item = this.state.items.find(i => i.route === routeInfo.route);
    if (item) {
      item.running = running;
    }
  }

  private populateAppMenu(): void {
    if (!this.state.appMenuLoaded) {
      for (const key of Object.keys(appRoutes)) {
        const routeInfo = appRoutes[key];
        // Show the Log menu only on Verbose
        if (key === AppRoute.Log && this.log.level === LogLevel.Verbose) {
         routeInfo.menuEnabled = true; 
        }
        if (routeInfo.menuEnabled) {
          this.state.items.push(this.createMenuItem(routeInfo.name, routeInfo.icon, false, null, routeInfo.route));
        }
      }

      this.state.appMenuLoaded = true;
    }
  }
}
