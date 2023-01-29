import { Component, OnInit } from '@angular/core';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';

@Component({
  selector: 'sp-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {

  constructor(private navbarService: NavBarStateService) { }

  ngOnInit(): void {
    this.initializeNavbar();
  }

  private initializeNavbar(): void {
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Some Option'
        }
      ],
      title: 'Home',
      leftIcon: {
        icon: 'mdi-home mdi'
      }
    });
  }
}
