import { Component, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SideBarStateService } from '../side-bar/side-bar-state.service';
import { Position } from '../../models/core.enum';
import { INavbarModel, INavBarOuterIcons, NavbarDisplayMode } from './nav-bar-model.interface';
import { NavBarStateService } from './nav-bar-state.service';
import { IIconAction } from '../../models/core.interface';
import { AppActionIcons } from 'src/app/app-icons';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';

/**
 * Component that displays a navigation bar at the top of the application.
 */
@Component({
  selector: 'sp-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {
  @ViewChild('spNavbarContentHost', { read: ViewContainerRef, static: true }) private navbarContentViewContainer: ViewContainerRef;
  @ViewChild('spNavbarSearchBox') private navbarSearchBox: ElementRef;
  public NavbarDisplayMode = NavbarDisplayMode;
  public model: INavbarModel;
  public outerIcons: INavBarOuterIcons;
  public AppActionIcons = AppActionIcons;

  constructor(
    private navbarService: NavBarStateService,
    private sidebarService: SideBarStateService,
    private navigationService: NavigationService
  ) { }

  public ngOnInit(): void {
    this.navbarService.saveComponentContainer(this.navbarContentViewContainer);
    this.model = this.navbarService.getState();
    this.outerIcons = this.navbarService.getOuterIcons();
    this.navbarService.register(this);
  }

  public onHamburgerClick(): void {
    this.sidebarService.toggle(Position.Left);
  }

  public onIconClick(iconAction: IIconAction): void {
    if (iconAction.off) {
      if (iconAction.offAction) {
        iconAction.offAction(iconAction);
      }
    }
    else {
      if (iconAction.action) {
        iconAction.action(iconAction);
      }
    }
  }

  public onSearchEnter(): void {
    if (this.model.onSearch) {
      this.model.onSearch(this.model.searchTerm);
    }
  }

  public onSearchClearClick(): void {
    this.model.searchTerm = '';
    this.searchBoxFocus();
    if (this.model.onSearchClear) {
      this.model.onSearchClear();
    }
  }

  public searchBoxFocus(): void {
    if (this.navbarSearchBox && this.navbarSearchBox.nativeElement) {
      this.navbarSearchBox.nativeElement.focus();
    }
  }

  public onBackClick(): void {
    let cancelBack = false;
    if (this.model.onBack) {
      cancelBack = this.model.onBack();
    }
    if (!cancelBack) {
      this.navigationService.back();
    }
  }

  public atHome(): boolean {
    return this.navigationService.atHome();
  }
}
