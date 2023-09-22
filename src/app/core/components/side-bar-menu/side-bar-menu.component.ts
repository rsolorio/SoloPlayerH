import { Component, OnInit } from '@angular/core';

import { IMenuModel } from '../../models/menu-model.interface';
import { SideBarStateService } from '../side-bar/side-bar-state.service';
import { Position } from '../../models/core.enum';
import { SideBarMenuStateService } from './side-bar-menu-state.service';
import { EventsService } from '../../services/events/events.service';
import { CoreEvent } from '../../services/events/events.enum';
import { ISideBarMenuModel } from './side-bar-menu-model.interface';
import { AppActionIcons } from 'src/app/app-icons';

@Component({
  selector: 'sp-side-bar-menu',
  templateUrl: './side-bar-menu.component.html',
  styleUrls: ['./side-bar-menu.component.scss']
})
export class SideBarMenuComponent implements OnInit {
  public AppActionIcons = AppActionIcons;
  public sidebarMenuModel: ISideBarMenuModel;

  constructor(
    private sidebarService: SideBarStateService,
    private sidebarMenuState: SideBarMenuStateService,
    private events: EventsService) {
    this.sidebarMenuModel = this.sidebarMenuState.getState();
  }

  public ngOnInit(): void {
    this.watchRouteChange();
  }

  public runMenuAction(menuItem: IMenuModel): void {
    if (menuItem.action) {
      menuItem.action(menuItem);
    }
    this.sidebarService.toggle(Position.Left);
  }

  private watchRouteChange(): void {
    this.events.onEvent<string>(CoreEvent.RouteChanged).subscribe(route => {
      this.sidebarMenuState.populateMenuByRoute(route);
      this.sidebarMenuState.activateByRoute(route);
    });
  }
}
