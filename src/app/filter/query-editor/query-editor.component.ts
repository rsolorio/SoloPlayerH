import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoute } from 'src/app/app-routes';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { CriteriaOperator } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { databaseColumns, DbColumn, IColumnMetadata } from 'src/app/shared/services/database/database.columns';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';

@Component({
  selector: 'sp-query-editor',
  templateUrl: './query-editor.component.html',
  styleUrls: ['./query-editor.component.scss']
})
export class QueryEditorComponent implements OnInit {
  public model: QueryModel<any>;
  public supportedColumns: IColumnMetadata[] = [];
  constructor(
    private sidebarService: SideBarStateService,
    private sidebarHostService: SideBarHostStateService,
    private db: DatabaseService,
    private utilities: UtilityService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private navbarService: NavBarStateService
  ) { }

  ngOnInit(): void {
    // TODO: save query objects on their own service
    // const queryId = this.utilities.getRouteParam('id', this.route);
    // Hack: we are getting the required information from the previous route,
    // but we should get everything from the route param: query object, entity, etc
    // Clone the object so we don't affect the original value
    const previousNavInfo = this.navigation.previous();
    this.model = previousNavInfo.options.query.clone();

    if (previousNavInfo.route === AppRoute.Songs) {
      this.supportedColumns = [
        databaseColumns[DbColumn.Rating],
        databaseColumns[DbColumn.Mood],
        databaseColumns[DbColumn.Language],
        databaseColumns[DbColumn.Favorite],
        databaseColumns[DbColumn.ReleaseDecade],
        databaseColumns[DbColumn.Lyrics],
      ];
    }

    this.navbarService.showBackIcon();
    this.initializeNavbar();
  }

  initializeNavbar(): void {
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Some Option'
        }
      ],
      title: 'Query',
      leftIcon: {
        icon: 'mdi-filter-outline mdi'
      },
      rightIcon: {
        icon: 'mdi-content-save mdi',
        action: () => {
          this.navigation.previous().options.query = this.model;
          this.navbarService.showToast('Saved!');
        }
      }
    });
  }

  getValues(columnName: string): string[] {
    const criteriaItem = this.model.userCriteria.find(item => item.ColumnName === columnName);
    if (criteriaItem) {
      return criteriaItem.ColumnValues;
    }
    return [];
  }

  onAddClick(column: IColumnMetadata): void {
    this.openChipSelectionPanel(column.name);
  }

  private async openChipSelectionPanel(columnName: string): Promise<void> {
    const chipSelectionModel: IChipSelectionModel = {
      title: this.db.displayName(columnName),
      values: [],
      singleSelect: columnName === DbColumn.Favorite,
      onOk: values => {
        let criteriaItem = this.model.userCriteria.find(item => item.ColumnName === columnName);
        if (!criteriaItem) {
          // TODO: Operator should be null (NO)/not null (YES) if the data type is not boolean
          // and the editor is Yes/No
          criteriaItem = new CriteriaValueBase(columnName, null, CriteriaOperator.Equals);
          this.model.userCriteria.push(criteriaItem);
        }
        criteriaItem.ColumnValues = values.map(value => value.data.toString());
      }
    };
    const criteriaItem = this.model.userCriteria.find(item => item.ColumnName === columnName);
    const availableValues = await this.db.getSongValues(columnName);
    for (const value of availableValues) {
      let selected = criteriaItem && criteriaItem.ColumnValues.includes(value.data.toString());
      value.selected = selected;
      chipSelectionModel.values.push(value);
    }
    this.sidebarHostService.loadComponent(ChipSelectionComponent, chipSelectionModel);
    this.sidebarService.toggleRight();
  }
}
