import { Component, OnInit } from '@angular/core';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { CriteriaOperator } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

@Component({
  selector: 'sp-filter-view',
  templateUrl: './filter-view.component.html',
  styleUrls: ['./filter-view.component.scss']
})
export class FilterViewComponent implements OnInit {

  public model: QueryModel<any>;

  public supportedColumns = ['rating', 'mood', 'language', 'favorite', 'releaseDecade', 'lyrics'];

  constructor(
    private sidebarService: SideBarStateService,
    private sidebarHostService: SideBarHostStateService,
    private db: DatabaseService) { }

  ngOnInit(): void {
  }

  getDisplayName(columnName: string): string {
    return this.db.displayName(columnName).toUpperCase();
  }

  getValues(columnName: string): string[] {
    const criteriaItem = this.model.userCriteria.find(item => item.ColumnName === columnName);
    if (criteriaItem) {
      return criteriaItem.ColumnValues;
    }
    return [];
  }

  onAddClick(columnName: string): void {
    this.openChipSelectionPanel(columnName);
  }

  private async openChipSelectionPanel(columnName: string): Promise<void> {
    const availableValues = await this.db.getSongValues(columnName);
    const chipSelectionModel: IChipSelectionModel = {
      title: this.db.displayName(columnName),
      values: [],
      onOk: values => {
        let criteriaItem = this.model.userCriteria.find(item => item.ColumnName === columnName);
        if (!criteriaItem) {
          criteriaItem = new CriteriaValueBase(columnName, null, CriteriaOperator.Equals);
          this.model.userCriteria.push(criteriaItem);
        }
        criteriaItem.ColumnValues = values.map(value => value.data);
      },
      singleSelect: columnName === 'favorite'
    };
    const criteriaItem = this.model.userCriteria.find(item => item.ColumnName === columnName);
    for (const value of availableValues) {
      let selected = criteriaItem && criteriaItem.ColumnValues.includes(value.toString());
      chipSelectionModel.values.push({
        id: value.toString(),
        caption: value.toString(),
        data: value.toString(),
        selected: selected
      });
    }
    this.sidebarHostService.loadComponent(ChipSelectionComponent, chipSelectionModel);
    this.sidebarService.toggleRight();
  }
}
