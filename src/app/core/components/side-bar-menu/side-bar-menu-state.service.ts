import { Injectable } from '@angular/core';

import { IMenuModel } from '../../models/menu-model.interface';
import { AppRoutes } from '../../services/utility/utility.enum';
import { ISideBarMenuModel } from './side-bar-menu-model.interface';
import { UtilityService } from '../../services/utility/utility.service';
import { EventsService } from '../../services/events/events.service';
import { CoreEvent } from '../../services/events/events.enum';

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
      this.state.items.push(this.createMenuItem('Home', 'mdi-home mdi', false, null, AppRoutes.Home));
      this.state.items.push(this.createMenuItem('Album Artists', 'mdi-account-badge mdi', false, null, AppRoutes.AlbumArtists));
      this.state.items.push(this.createMenuItem('Artists', 'mdi-account-music mdi', false, null, AppRoutes.Artists));
      this.state.items.push(this.createMenuItem('Albums', 'mdi-album mdi', false, null, AppRoutes.Albums));
      this.state.items.push(this.createMenuItem('Genres', 'mdi-tag-outline mdi', false, null, AppRoutes.Genres));
      this.state.items.push(this.createMenuItem('Classifications', 'mdi-tag-multiple-outline mdi', false, null, AppRoutes.Classifications));
      this.state.items.push(this.createMenuItem('Songs', 'mdi-music-note mdi', false, null, AppRoutes.Songs));
      this.state.items.push(this.createMenuItem('Playlists', 'mdi-playlist-play mdi', false, null, AppRoutes.Playlists));
      this.state.items.push(this.createMenuItem('Filters', 'mdi-filter-outline mdi', false, null, AppRoutes.Filters));
      this.state.items.push(this.createMenuItem('Settings', 'mdi-cogs mdi', false, null, AppRoutes.Settings));
      this.state.items.push(this.createMenuItem('Log', 'mdi-file-document-edit-outline mdi', false, null, AppRoutes.Log));

      this.state.items.push(this.createAboutMenuItem());
      this.state.appMenuLoaded = true;
    }
  }
}
