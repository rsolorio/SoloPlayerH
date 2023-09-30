import { ChangeDetectorRef, Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { SlideMenu } from 'primeng/slidemenu';
import { IMenuModel } from '../../models/menu-model.interface';

/**
 * Helper service for handling interactions with the PrimeNg menus.
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {
  /** Contains an instance of the last menu that was displayed. */
  private lastSlideMenu: SlideMenu;
  private lastCdr: ChangeDetectorRef;

  constructor() {
  }

  /**
   * Displays the slide menu and also applies a hack that fixes the height of its content.
   * @param menu The NgPrime slide menu instance.
   */
   public showSlideMenu(menu: SlideMenu, cdr: ChangeDetectorRef, event: any, autoHeight?: boolean): void {
     if (menu.visible) {
       // If we are trying to show the same menu that is already visible just hide it
       this.hideSlideMenu();
     }
     else {
      // If we are trying to open a menu that is not visible, hide whatever other menu is being displayed first
      this.hideSlideMenu();
      this.lastSlideMenu = menu;
      this.lastCdr = cdr;
      if (autoHeight) {
        this.setSlideMenuHeight(menu, this.getRealItemCount(menu.model), this.getSeparatorCount(menu.model));
      }
      menu.toggle(event);
      setTimeout(() => {
        // Hack that expands the height of the content of the menu
        if (menu.slideMenuContentViewChild) {
          menu.slideMenuContentViewChild.nativeElement.style.height = menu.viewportHeight + 'px';
        }
      });
     }
  }

  /** Hides the current instance of the slide menu being displayed. */
  public hideSlideMenu(): void {
    if (this.lastSlideMenu) {
      if (this.lastSlideMenu.visible) {
        this.lastSlideMenu.hide();
        // This is a hack for closing the slide menu. Latest versions of the component handle this internally.
        if (this.lastCdr) {
          this.lastCdr.detectChanges();
        }
      }
      this.lastSlideMenu = null;
      this.lastCdr = null;
    }
  }

  /**
   * Sets the proper height of the menu based on the number of items to be displayed.
   * @param menu The NgPrime slide menu instance
   * @param items The number of items in the menu
   */
  public setSlideMenuHeight(menu: SlideMenu, items: number, separators: number): void {
    // The actual height of the item is 42.72px
    // which is calculated based on the text size (default prime ng size) and with a padding of 0.714em
    // Inspect the actual size and set it here
    const menuItemHeight = 41;
    const separatorHeight = 2;
    menu.viewportHeight = (items * menuItemHeight) + (separators * separatorHeight);
  }

  /**
   * Sets the width of the slide menu.
   * @param menu The NgPrime slide menu instance
   * @param width The width to set
   */
  public setSlideMenuWidth(menu: SlideMenu, width: number): void {
    menu.menuWidth = width;
  }

  public buildSlideMenu(menu: SlideMenu, menuItems: IMenuModel[], actionParam?: any): void {
    menu.model = this.buildNgMenu(menuItems, actionParam);
  }

  public findById(id: string, menuList: IMenuModel[]): IMenuModel {
    let result: IMenuModel = null;
    if (menuList && menuList.length) {
      menuList.forEach(menu => {
        if (!result && menu.id === id) {
          result = menu;
        }
      });
    }
    return result;
  }

  private buildNgMenu(source: IMenuModel[], actionParam?: any): MenuItem[] {
    const result: MenuItem[] = [];
    if (source && source.length) {
      source.forEach(item => {
        const newItem: MenuItem = {
          id: item.id,
          label: item.caption,
          icon: item.icon,
          badge: item.badge,
          disabled: item.disabled,
          visible: item.hidden ? false : true,
          styleClass: item.styleClass,
          separator: item.isSeparator,
          command: () => {
            if (item.action) {
              if (item.actionTimeout) {
                // I'm giving a timeout to allow the menu to close before we actually execute the command
                setTimeout(() => {
                  item.action(item, actionParam);
                }, item.actionTimeout);
              }
              else {
                item.action(item, actionParam);
                // Not using a timeout causes the menu to stay visible, so we need to force it to close
                this.hideSlideMenu();
              }
            }
          }
        };

        if (item.active === true) {
          newItem.icon = 'mdi mdi-check-box-outline';
        }
        else if (item.active === false) {
          newItem.icon = 'mdi mdi-checkbox-blank-outline';
        }

        if (item.items) {
          // Recursive call
          newItem.items = this.buildNgMenu(item.items, actionParam);
        }

        result.push(newItem);
      });
    }
    return result;
  }

  private getRealItemCount(menuItems: MenuItem[]): number {
    let result = 0;
    menuItems.forEach(menuItem => {
      if (menuItem.visible && !menuItem.separator) {
        result++;
      }
    });
    return result;
  }

  private getSeparatorCount(menuItems: MenuItem[]): number {
    let result = 0;
    menuItems.forEach(menuItem => {
      if (menuItem.visible && menuItem.separator) {
        result++;
      }
    });
    return result;
  }
}
