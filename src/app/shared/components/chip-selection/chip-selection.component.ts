import { Component, OnInit } from '@angular/core';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { ChipDisplayMode, ChipSelectorType, IChipItem, IChipSelectionModel } from './chip-selection-model.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';

@Component({
  selector: 'sp-chip-selection',
  templateUrl: './chip-selection.component.html',
  styleUrls: ['./chip-selection.component.scss']
})
export class ChipSelectionComponent implements OnInit {
  public ChipDisplayMode = ChipDisplayMode;
  public ChipSelectorType = ChipSelectorType;
  /** Model of the component. It will be set by the service. */
  public model: IChipSelectionModel;

  constructor(
    private utility: UtilityService,
    private sidebarHostService: SideBarHostStateService) { }

  ngOnInit(): void {
  }

  onChipItemClick(chipItem: IChipItem): void {
    this.chipClick(chipItem);
  }

  private chipClick(chipItem: IChipItem): void {
    if (this.model.type === ChipSelectorType.SingleOk ||
      this.model.type === ChipSelectorType.YesNo ||
      this.model.type === ChipSelectorType.Quick) {
      // In this mode, we only allow to select (but not to un-select)
      if (chipItem.selected) {
        if (this.model.onChipClick) {
          this.model.onChipClick(false, chipItem, this.model);
        }
      }
      else {
        // Select item
        chipItem.selected = true;
        // Un select everything else
        for (const valuePair of this.model.items) {
          if (valuePair.value !== chipItem.value) {
            valuePair.selected = false;
          }
        }
        if (this.model.onChipClick) {
          this.model.onChipClick(true, chipItem, this.model);
        }
        
        // Confirm immediately
        if (this.model.type === ChipSelectorType.Quick) {
          this.sidebarHostService.closeOk();
        }
      }
    }
    else {
      let selectedValues: ISelectableValue[];
      if (chipItem.selected) {
        chipItem.selected = false;
        chipItem.sequence = 0;
        selectedValues = this.model.items.filter(v => v.selected);
        selectedValues = this.utility.sort(selectedValues, 'sequence');
      }
      else {
        selectedValues = this.model.items.filter(v => v.selected);
        selectedValues = this.utility.sort(selectedValues, 'sequence');
        chipItem.selected = true;
        selectedValues.push(chipItem);
      }
      // Fix sequence in selected values
      for (let valueIndex = 0; valueIndex < selectedValues.length; valueIndex++) {
        selectedValues[valueIndex].sequence = valueIndex + 1;
      }
      if (this.model.onChipClick) {
        this.model.onChipClick(true, chipItem, this.model);
      }
    }
  }
}
