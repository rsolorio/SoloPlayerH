import { Component, OnInit } from '@angular/core';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { IconActionArray } from 'src/app/core/models/icon-action-array.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';

@Component({
  selector: 'sp-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {

  constructor(
    private utilities: UtilityService,
    private navbarService: NavBarStateService,
    private navigationService: NavigationService,
    private breadcrumbService: BreadcrumbsStateService) { }

  ngOnInit(): void {
    this.initializeNavbar();
    this.breadcrumbService.clear();
    // Restart navigation history in home
    this.navigationService.clear();
  }

  private initializeNavbar(): void {
    const routeInfo = this.utilities.getCurrentRouteInfo();
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Some Option'
        }
      ],
      title: routeInfo.name,
      leftIcon: {
        icon: routeInfo.icon
      },
      rightIcons: new IconActionArray(),
      backHidden: true
    });
  }
}
