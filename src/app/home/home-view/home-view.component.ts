import { Component, OnInit } from '@angular/core';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Component({
  selector: 'sp-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {

  constructor(private utilities: UtilityService, private navbarService: NavBarStateService) { }

  ngOnInit(): void {
    this.initializeNavbar();
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
      }
    });
  }
}
