import { Injectable } from '@angular/core';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ValueListEntryEntity } from 'src/app/shared/entities';
import { IValueListSelectorModel } from './value-list-selector-model.interface';
import { ValueListSelectorComponent } from './value-list-selector.component';

/**
 * OBSOLETE. Same as the value-list-selector component.
 */
@Injectable({
  providedIn: 'root'
})
export class ValueListSelectorService {

  constructor(
    private sidebarHostService: SideBarHostStateService,
    private sidebarService: SideBarStateService,
    private utility: UtilityService) { }

  public show(model: IValueListSelectorModel): void {
    this.showInPanel(model);
  }

  private async showInPanel(model: IValueListSelectorModel): Promise<void> {
    if (!model.entries || !model.entries.length) {
      model.entries = await ValueListEntryEntity.findBy({ valueListTypeId: model.valueListTypeId });
      if (model.sortByName) {
        model.entries = this.utility.sort(model.entries, 'name');
      }
      else {
        model.entries = this.utility.sort(model.entries, 'sequence');
      }
    }

    if (model.selectedIds && model.selectedIds.length) {
      for (const entry of model.entries) {
        if (model.selectedIds.includes(entry.id)) {
          entry.selected = true;
        }
      }
    }
    if (model.selectedValues && model.selectedValues.length) {
      for (const entry of model.entries) {
        if (model.selectedValues.includes(entry.name)) {
          entry.selected = true;
        }
      }
    }
    //this.sidebarHostService.loadComponent(ValueListSelectorComponent, model);
    this.sidebarService.toggleRight();
  }
}
