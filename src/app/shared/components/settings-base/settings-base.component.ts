import { Component, Input, OnInit } from '@angular/core';
import { ISetting, ISettingCategory } from './settings-base.interface';
import { SettingsEditorType } from './settings-base.enum';
import { AppActionIcons, AppAttributeIcons } from 'src/app/app-icons';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { IInputEditorModel } from '../input-editor/input-editor.interface';
import { InputEditorComponent } from '../input-editor/input-editor.component';
import { ChipDisplayMode, ChipSelectorType, IChipItem, IChipSelectionModel } from '../chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from '../chip-selection/chip-selection.component';

@Component({
  selector: 'sp-settings-base',
  templateUrl: './settings-base.component.html',
  styleUrls: ['./settings-base.component.scss']
})
export class SettingsBaseComponent implements OnInit {
  public EditorType = SettingsEditorType;
  public AppAttributeIcons = AppAttributeIcons;
  @Input() public model: ISettingCategory[] = [];
  constructor(private sidebarHostService: SideBarHostStateService) { }

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
      this.openNumericEditorPanel(setting);
    }
    else if (setting.editorType === SettingsEditorType.List) {
      this.openListQuickEditorPanel(setting);
    }
    else if (setting.editorType === SettingsEditorType.ListMultiple) {
      this.openListMultipleEditorPanel(setting);
    }
  }

  private async openNumericEditorPanel(setting: ISetting): Promise<void> {
    const model: IInputEditorModel = {
      componentType: InputEditorComponent,
      title: 'Edit',
      titleIcon: AppActionIcons.Edit,
      type: 'number',
      value: setting.data,
      label: '',
      onOk: result => {
        const inputResult = result as IInputEditorModel;
        setting.data = inputResult.value;
        setting.onChange(setting);
      }
    };
    if (setting.beforePanelOpen) {
      await setting.beforePanelOpen(model);
    }
    this.sidebarHostService.loadContent(model);
  }

  private async openListQuickEditorPanel(setting: ISetting): Promise<void> {
    const model: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Edit',
      titleIcon: AppActionIcons.Edit,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: [],
      onChipClick: (selectionChanged: boolean, chipItem: IChipItem) => {
        if (selectionChanged) {
          setting.data = chipItem.value;
          setting.onChange(setting);
        }
      }
    };
    if (setting.beforePanelOpen) {
      await setting.beforePanelOpen(model);
    }
    this.sidebarHostService.loadContent(model);
  }

  private async openListMultipleEditorPanel(setting: ISetting): Promise<void> {
    const model: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Edit',
      titleIcon: AppActionIcons.Edit,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.MultipleOk,
      items: [],
      onOk: selectionModel => {
        setting.data = selectionModel.items.filter(i => i.selected).map(i => i.value);
        setting.onChange(setting);
      }
    };
    if (setting.beforePanelOpen) {
      await setting.beforePanelOpen(model);
    }
    this.sidebarHostService.loadContent(model);
  }

}
