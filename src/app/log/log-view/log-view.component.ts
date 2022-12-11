import { Component, OnInit } from '@angular/core';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { ILogEntry } from 'src/app/core/services/log/log.interface';
import { LogService } from 'src/app/core/services/log/log.service';

@Component({
  selector: 'sp-log-view',
  templateUrl: './log-view.component.html',
  styleUrls: ['./log-view.component.scss']
})
export class LogViewComponent implements OnInit {
  public logItems: ILogEntry[];
  constructor(
    private log: LogService,
    private navBarService: NavBarStateService) { }

  ngOnInit(): void {
    this.reloadLogEntries();
    this.initializeNavbar();
  }

  private initializeNavbar(): void {
    this.navBarService.set({
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
      title: 'Event Log',
      leftIcon: {
        icon: 'mdi-file-document-edit-outline mdi'
      },
      rightIcon: {
        icon: 'mdi mdi-eraser',
        action: () => {
          this.log.clear();
          this.reloadLogEntries();
          this.navBarService.showToast('Log entries deleted.');
        }
      }
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
