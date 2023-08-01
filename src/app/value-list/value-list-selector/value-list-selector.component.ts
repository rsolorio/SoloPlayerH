import { Component, OnInit } from '@angular/core';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ValueListEntryEntity } from 'src/app/shared/entities';
import { IValueListSelectorModel, ValueListSelectMode } from './value-list-selector-model.interface';

/**
 * OBSOLETE. This component became obsolete when the chip-selection component was implemented.
 */
@Component({
  selector: 'sp-value-list-selector',
  templateUrl: './value-list-selector.component.html',
  styleUrls: ['./value-list-selector.component.scss']
})
export class ValueListSelectorComponent implements OnInit {
  public ValueListSelectMode = ValueListSelectMode;

  /** Model of the component. It will be set by the service. */
  public model: IValueListSelectorModel;

  constructor(private sidebarService: SideBarStateService, private utility: UtilityService) { }

  ngOnInit(): void {
  }

  public onEntryClick(entry: ValueListEntryEntity): void {
    if (this.model.selectMode === ValueListSelectMode.Multiple) {
      entry.selected = !entry.selected;
      this.model.selectedValues = this.model.entries.filter(entry => entry.selected).map(entry => entry.name);
    }
    else {
      if (entry.selected) {
        // Don't do anything as we need at least one selected entry
      }
      else {
        for (const item of this.model.entries) {
          item.selected = false;
        }
        entry.selected = true;
        this.model.selectedValues = [entry.name];
        if (this.model.selectMode === ValueListSelectMode.Quick) {
          this.onOkClick();
        }
      }
    }
  }

  public onOkClick(): void {
    if (this.model.onOk) {
      // Send selected values
      this.model.onOk(this.model.entries.filter(entry => entry.selected));
    }
    this.sidebarService.hideRight();
  }

  public onCancelClick(): void {
    if (this.model.onCancel) {
      this.model.onCancel();
    }
    this.sidebarService.hideRight();
  }
}
