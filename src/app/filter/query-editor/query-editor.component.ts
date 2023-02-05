import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoute } from 'src/app/app-routes';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { IValuePair } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionService } from 'src/app/shared/components/chip-selection/chip-selection.service';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison, CriteriaDataType, CriteriaValueEditor } from 'src/app/shared/services/criteria/criteria.enum';
import { ICriteriaValueSelector } from 'src/app/shared/services/criteria/criteria.interface';
import { DbColumn } from 'src/app/shared/services/database/database.columns';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';

@Component({
  selector: 'sp-query-editor',
  templateUrl: './query-editor.component.html',
  styleUrls: ['./query-editor.component.scss']
})
export class QueryEditorComponent implements OnInit {
  public model: Criteria;
  public supportedSelectors: ICriteriaValueSelector[] = [];
  constructor(
    private db: DatabaseService,
    private utilities: UtilityService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private navbarService: NavBarStateService,
    private chipSelectionService: ChipSelectionService
  ) { }

  ngOnInit(): void {
    // TODO: save query objects on their own service
    // const queryId = this.utilities.getRouteParam('id', this.route);
    // Hack: we are getting the required information from the previous route,
    // but we should get everything from the route param: query object, entity, etc
    // Clone the object so we don't affect the original value until we save
    const previousNavInfo = this.navigation.previous();
    this.model = previousNavInfo.options.criteria.clone();

    if (previousNavInfo.route === AppRoute.Songs) {
      this.supportedSelectors = [
        this.db.selector(DbColumn.Rating),
        this.db.selector(DbColumn.Mood),
        this.db.selector(DbColumn.Language),
        this.db.selector(DbColumn.Favorite),
        this.db.selector(DbColumn.ReleaseDecade),
        this.db.selector(DbColumn.Lyrics)
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
          this.navigation.previous().options.criteria = this.model;
          this.navbarService.showToast('Saved!');
        }
      }
    });
  }

  getSelectedValues(selector: ICriteriaValueSelector): IValuePair[] {
    const criteriaItem = this.model.userCriteria.find(item => item.columnName === selector.column.name);
    if (criteriaItem) {
      return criteriaItem.columnValues;
    }
    return [];
  }

  onAddClick(selector: ICriteriaValueSelector): void {
    this.openChipSelectionPanel(selector);
  }

  private async openChipSelectionPanel(selector: ICriteriaValueSelector): Promise<void> {
    const criteriaItem = this.model.userCriteria.find(item => item.columnName === selector.column.name);
    const selectedValues = criteriaItem ? criteriaItem.columnValues.map(pair => pair.value) : [];
    selector.values = await selector.getValues();
    // Clone the values, we will update the actual criteria values once the user clicks ok (onOk).
    for (const valuePair of selector.values) {
      valuePair.selected = selectedValues.includes(valuePair.value);
    }

    // Create the model
    const chipSelectionModel: IChipSelectionModel = {
      selector: selector,
      onOk: values => {
        let criteriaItem = this.model.userCriteria.find(item => item.columnName === selector.column.name);
        if (!criteriaItem) {
          criteriaItem = new CriteriaItem(selector.column.name);
          this.model.userCriteria.push(criteriaItem);
        }
        // Default comparison if no one is set
        if (criteriaItem.comparison === CriteriaComparison.None) {
          criteriaItem.comparison = CriteriaComparison.Equals;
        }
        criteriaItem.columnValues = values;

        // Special cases by editor
        if (selector.editor === CriteriaValueEditor.YesNo) {
          // Special case only when yes/no is not a boolean
          if (selector.column.dataType !== CriteriaDataType.Boolean) {
            if (criteriaItem.columnValues.length) {
              if (criteriaItem.columnValues[0].value) {
                // YES (true) should be NOT NULL
                criteriaItem.comparison = CriteriaComparison.IsNotNull;
              }
              else {
                // NO (false) should be NULL
                criteriaItem.comparison = CriteriaComparison.IsNull;
              }
            }
            else {
              // If no values, make sure to remove the comparison
              criteriaItem.comparison = CriteriaComparison.None;
            }
          }
        }
      }
    };

    this.chipSelectionService.showInPanel(chipSelectionModel);
  }
}
