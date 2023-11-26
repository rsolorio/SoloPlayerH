import { Component, OnInit } from '@angular/core';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { ILogEntry } from 'src/app/core/services/log/log.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IconActionArray } from 'src/app/core/models/icon-action-array.class';

@Component({
  selector: 'sp-log-view',
  templateUrl: './log-view.component.html',
  styleUrls: ['./log-view.component.scss']
})
export class LogViewComponent implements OnInit {
  public logItems: ILogEntry[];
  constructor(
    private log: LogService,
    private navbarService: NavBarStateService,
    private utilities: UtilityService) { }

  ngOnInit(): void {
    this.reloadLogEntries();
    this.initializeNavbar();
  }

  private initializeNavbar(): void {
    const icons = new IconActionArray();
    icons.push({
      icon: 'mdi mdi-eraser',
      action: () => {
        this.log.clear();
        this.reloadLogEntries();
        this.navbarService.showToast('Log entries deleted.');
      }
    });
    const routeInfo = this.utilities.getCurrentRouteInfo();
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Show All'
        },
        {
          caption: 'Show Errors'
        },
        {
          caption: 'Show Warnings'
        },
        {
          caption: 'Log Level'
        }
      ],
      title: routeInfo.name,
      leftIcon: {
        icon: routeInfo.icon
      },
      rightIcons: icons
    });
  }

  public onLogItemClick(logItem: ILogEntry) {
    if (logItem.data) {
    }
  }

  private reloadLogEntries(): void {
    this.logItems = this.log.get();
  }
}
