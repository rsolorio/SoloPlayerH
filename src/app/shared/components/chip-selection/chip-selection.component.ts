import { Component, OnInit } from '@angular/core';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { ISelectedDataItem } from 'src/app/core/models/core.interface';
import { IChipSelectionModel } from './chip-selection-model.interface';

@Component({
  selector: 'sp-chip-selection',
  templateUrl: './chip-selection.component.html',
  styleUrls: ['./chip-selection.component.scss']
})
export class ChipSelectionComponent implements OnInit {

  public model: IChipSelectionModel = {
    title: '',
    values: [],
    onOk: () => {}
  };

  constructor(private sidebarService: SideBarStateService) { }

  ngOnInit(): void {
  }

  onChipValueClick(chipValue: ISelectedDataItem<string>): void {
    if (this.model.singleSelect) {
      // In this mode, we only allow to select (but not to un-select)
      if (!chipValue.selected) {
        // Select item
        chipValue.selected = true;
        // Un select everything else
        for (const value of this.model.values) {
          if (value.id !== chipValue.id) {
            value.selected = false;
          }
        }
      }
    }
    else {
      // In this mode just revert the selected state
      chipValue.selected = !chipValue.selected;
    }
  }

  onCancelClick(): void {
    if (this.model.onCancel) {
      this.model.onCancel();
    }
    this.sidebarService.hideRight();
  }

  onOkClick(): void {
    if (this.model.onOk) {
      // Send selected values
      this.model.onOk(this.model.values.filter(value => value.selected));
    }
    this.sidebarService.hideRight();
  }
}
