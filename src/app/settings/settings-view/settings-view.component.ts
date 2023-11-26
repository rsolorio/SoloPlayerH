import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { SettingsViewStateService } from './settings-view-state.service';
import { ISettingCategory } from 'src/app/shared/components/settings-base/settings-base.interface';
import { IconActionArray } from 'src/app/core/models/icon-action-array.class';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent extends CoreComponent implements OnInit {
  public settingsInfo: ISettingCategory[];
  constructor(
    private utility: UtilityService,
    private navbarService: NavBarStateService,
    private loadingService: LoadingViewStateService,
    private stateService: SettingsViewStateService)
  {
    super();
  }

  ngOnInit(): void {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.loadingService.show();
    this.initializeNavbar();
    if (!this.stateService.getState()) {
      this.stateService.initializeState();
    }
    await this.stateService.updateState();
    this.settingsInfo = this.stateService.getState();
    this.loadingService.hide();
  }

  private initializeNavbar(): void {
    const routeInfo = this.utility.getCurrentRouteInfo();
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
      rightIcons: new IconActionArray()
    });
  }
}
