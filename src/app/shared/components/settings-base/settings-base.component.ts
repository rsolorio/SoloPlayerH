import { Component, Input, OnInit } from '@angular/core';
import { ISetting, ISettingCategory } from './settings-base.interface';

@Component({
  selector: 'sp-settings-base',
  templateUrl: './settings-base.component.html',
  styleUrls: ['./settings-base.component.scss']
})
export class SettingsBaseComponent implements OnInit {
  @Input() public model: ISettingCategory[] = [];
  constructor() { }

  ngOnInit(): void {
  }

  public onSettingClick(setting: ISetting): void {
    if (setting.action && !setting.disabled) {
      setting.action(setting);
    }
  }

}
