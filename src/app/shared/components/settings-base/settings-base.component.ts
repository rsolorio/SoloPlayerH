import { Component, Input, OnInit } from '@angular/core';
import { ISetting, ISettingCategory } from './settings-base.interface';
import { SettingsEditorType } from './settings-base.enum';
import { AppAttributeIcons } from 'src/app/app-icons';

@Component({
  selector: 'sp-settings-base',
  templateUrl: './settings-base.component.html',
  styleUrls: ['./settings-base.component.scss']
})
export class SettingsBaseComponent implements OnInit {
  public EditorType = SettingsEditorType;
  public AppAttributeIcons = AppAttributeIcons;
  @Input() public model: ISettingCategory[] = [];
  constructor() { }

  ngOnInit(): void {
  }

  public onSettingClick(setting: ISetting): void {
    if (setting.disabled) {
      return;
    }
    if (setting.action) {
      setting.action(setting);
    }
    else if (setting.editorType === SettingsEditorType.YesNo) {
      setting.data = !setting.data;
      if (setting.onChange) {
        setting.onChange(setting);
      }
    }
    else if (setting.editorType === SettingsEditorType.Number) {

    }
  }

  private openNumericEditorPanel(): void {}

}
