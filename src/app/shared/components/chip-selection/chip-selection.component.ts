import { Component, OnInit } from '@angular/core';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { CriteriaValueEditor } from '../../services/criteria/criteria.enum';
import { IChipSelectionModel } from './chip-selection-model.interface';
import { ChipSelectionService } from './chip-selection.service';

@Component({
  selector: 'sp-chip-selection',
  templateUrl: './chip-selection.component.html',
  styleUrls: ['./chip-selection.component.scss']
})
export class ChipSelectionComponent implements OnInit {

  public model: IChipSelectionModel;

  constructor(
    private stateService: ChipSelectionService,
    private sidebarService: SideBarStateService) { }

  ngOnInit(): void {
    this.model = this.stateService.getState();
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
      this.model.onOk(this.model.selector.values.filter(value => value.selected));
    }
    this.sidebarService.hideRight();
  }
}