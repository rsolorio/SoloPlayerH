import { Component, OnInit } from '@angular/core';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { CriteriaValueEditor } from '../../services/criteria/criteria.enum';
import { ChipDisplayMode, IChipSelectionModel } from './chip-selection-model.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Component({
  selector: 'sp-chip-selection',
  templateUrl: './chip-selection.component.html',
  styleUrls: ['./chip-selection.component.scss']
})
export class ChipSelectionComponent implements OnInit {
  public ChipDisplayMode = ChipDisplayMode;
  /** Model of the component. It will be set by the service. */
  public model: IChipSelectionModel;

  constructor(private sidebarService: SideBarStateService, private utility: UtilityService) { }

  ngOnInit(): void {
  }

  onChipValueClick(chipValue: ISelectableValue): void {
    if (this.model.selector.editor === CriteriaValueEditor.Single || this.model.selector.editor === CriteriaValueEditor.YesNo) {
      // In this mode, we only allow to select (but not to un-select)
      if (!chipValue.selected) {
        // Select item
        chipValue.selected = true;
        // Un select everything else
        for (const valuePair of this.model.selector.values) {
          if (valuePair.value !== chipValue.value) {
            valuePair.selected = false;
          }
        }
      }
    }
    else {
      let selectedValues: ISelectableValue[];
      if (chipValue.selected) {
        chipValue.selected = false;
        chipValue.sequence = 0;
        selectedValues = this.model.selector.values.filter(v => v.selected);
        selectedValues = this.utility.sort(selectedValues, 'sequence');
      }
      else {
        selectedValues = this.model.selector.values.filter(v => v.selected);
        selectedValues = this.utility.sort(selectedValues, 'sequence');
        chipValue.selected = true;
        selectedValues.push(chipValue);
      }
      // Fix sequence in selected values
      for (let valueIndex = 0; valueIndex < selectedValues.length; valueIndex++) {
        selectedValues[valueIndex].sequence = valueIndex + 1;
      }
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
      const selectedValues = this.model.selector.values.filter(value => value.selected);
      this.model.onOk(selectedValues);
    }
    this.sidebarService.hideRight();
  }
}
