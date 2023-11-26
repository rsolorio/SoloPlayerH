import { Injectable } from '@angular/core';
import { INavbarModel, NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { IListBaseModel } from './list-base-model.interface';
import { IIconAction } from 'src/app/core/models/core.interface';
import { AppActionIcons } from 'src/app/app-icons';

@Injectable({
  providedIn: 'root'
})
export class ListBaseService {

  constructor(
    private navbarService: NavBarStateService
  ) { }

  public handleIconsVisibility(model: IListBaseModel, navbar: INavbarModel): void {
    navbar.leftIcon.off = !model.criteriaResult.criteria.hasComparison(true);
    switch (navbar.mode) {
      case NavbarDisplayMode.Component:
        // Hide all the icons
        navbar.rightIcons.hideAll();
        navbar.rightIcons.off('searchIcon');
        break;
      case NavbarDisplayMode.Title:
        // Show all icons
        navbar.rightIcons.showAll();
        navbar.rightIcons.off('searchIcon');
        break;
      case NavbarDisplayMode.Search:
        // Show search, hide the rest of the icons
        navbar.rightIcons.hideAll();
        navbar.rightIcons.show('searchIcon');
        break;
    }
  }

  public createSearchIcon(id: string): IIconAction {
    const navbar = this.navbarService.getState();
    const searchIcon: IIconAction = {
      id: id,
      icon: AppActionIcons.SearchClose,
      action: iconAction => {
        // This will turn OFF the search
        iconAction.off = true;
        navbar.searchTerm = '';
        if (navbar.onSearch) {
          navbar.onSearch(navbar.searchTerm);
        }
        // The only way to get to the search mode is from the Title mode,
        // so for now go back to title mode from search mode
        this.navbarService.setMode(NavbarDisplayMode.Title);
      },
      off: true, // Search turned off by default
      offIcon: AppActionIcons.Search,
      offAction: iconAction => {
        // This will turn ON the search
        iconAction.off = false;
        navbar.searchTerm = '';
        this.navbarService.setMode(NavbarDisplayMode.Search);
        // Give the search box time to render before setting focus
        setTimeout(() => {
          this.navbarService.searchBoxFocus();
        });
      }
    };
    return searchIcon;
  }

  public createBackIcon(id: string): IIconAction {
    const backIcon: IIconAction = {
      id: id,
      icon: AppActionIcons.Back,
      action: iconAction => {
        
      }
    };
    return backIcon;
  }
}
