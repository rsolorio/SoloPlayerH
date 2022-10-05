import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SideBarStateService } from '../side-bar/side-bar-state.service';
import { Position } from '../../globals.enum';
import { INavbarModel } from './nav-bar-model.interface';
import { NavBarStateService } from './nav-bar-state.service';
import { EventsService } from '../../services/events/events.service';
import { CoreEvent } from '../../services/events/events.enum';

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
  public model: INavbarModel;

  constructor(private navbarService: NavBarStateService, private sidebarService: SideBarStateService, private events: EventsService) { }

  public ngOnInit(): void {
    this.navbarService.saveComponentContainer(this.navbarContentViewContainer);
    this.model = this.navbarService.getState();

    // Auto hide when scrolling down
    this.events.onEvent(CoreEvent.WindowScrollDown).subscribe(() => {
      this.navbarService.hide();
    });
    // Auto show when scrolling up
    this.events.onEvent(CoreEvent.WindowScrollUp).subscribe(() => {
      this.navbarService.show();
    });
  }

  public onHamburgerClick(): void {
    this.sidebarService.toggle(Position.Left);
  }

  public onLeftIconClick(): void {
    if (this.model.leftIcon && this.model.leftIcon.action) {
      this.model.leftIcon.action();
    }
  }

  public onRightIconClick(): void {
    if (this.model.rightIcon && this.model.rightIcon.action) {
      this.model.rightIcon.action();
    }
  }
}
