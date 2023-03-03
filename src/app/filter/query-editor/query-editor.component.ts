import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoute } from 'src/app/app-routes';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { IValuePair } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionService } from 'src/app/shared/components/chip-selection/chip-selection.service';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison, CriteriaDataType, CriteriaTransformAlgorithm, CriteriaValueEditor } from 'src/app/shared/services/criteria/criteria.enum';
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
  public sortBySelector: ICriteriaValueSelector;
  public transformSelector: ICriteriaValueSelector;
  constructor(
    private db: DatabaseService,
    private utilities: UtilityService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private navbarService: NavBarStateService,
    private chipSelectionService: ChipSelectionService,
    private loadingService: LoadingViewStateService
  ) { }

  ngOnInit(): void {
    this.loadingService.show();
    this.navbarService.showBackIcon();
    this.initializeNavbar();
    this.setupSelectors().then(criteria => {
      this.model = criteria;
      this.loadingService.hide();
    });
  }

  private async setupSelectors(): Promise<Criteria> {
    // TODO: save query objects on their own service
    // const queryId = this.utilities.getRouteParam('id', this.route);
    // Hack: we are getting the required information from the previous route,
    // but we should get everything from the route param: query object, entity, etc
    // Clone the object so we don't affect the original value until we save
    const previousNavInfo = this.navigation.previous();
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

    const criteriaClone = previousNavInfo.options.criteria.clone();

    for (const selector of this.supportedSelectors) {
      const criteriaItem = criteriaClone.userCriteria.find(item => item.columnName === selector.column.name);
      const selectedValues = criteriaItem ? criteriaItem.columnValues.map(pair => pair.value) : [];
      selector.values = await selector.getValues();
      // Clone the values, we will update the actual criteria values once the user clicks ok (onOk).
      for (const valuePair of selector.values) {
        valuePair.selected = selectedValues.includes(valuePair.value);
      }
    }

    // Sort By
    this.sortBySelector = this.db.selector(DbColumn.SortBy);
    this.sortBySelector.values = await this.sortBySelector.getValues();
    for (const valuePair of this.sortBySelector.values) {
      const criteriaItem = criteriaClone.sortingCriteria.find(item => item.columnName === valuePair.value);
      valuePair.selected = criteriaItem && criteriaItem.sortSequence > 0;
    }
    // Transform
    this.transformSelector = this.db.selector(DbColumn.TransformAlgorithm);
    this.transformSelector.values = await this.transformSelector.getValues();
    for (const valuePair of this.transformSelector.values) {
      valuePair.selected = valuePair.value === criteriaClone.transformAlgorithm;
    }

    return criteriaClone;
  }

  initializeNavbar(): void {
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Save',
          icon: 'mdi-content-save-outline mdi',
          action: () => {
            this.navigation.previous().options.criteria = this.model;
            this.navbarService.showToast('Saved!');
          }
        }
      ],
      title: 'Criteria Selector',
      leftIcon: {
        icon: 'mdi-filter-outline mdi'
      },
      rightIcon: {
        icon: 'mdi-content-save-check-outline mdi',
        action: () => {
          this.navigation.previous().options.criteria = this.model;
          this.navigation.back();
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

  onChipCloseClick(selector: ICriteriaValueSelector, chip: IValuePair): void {
    const criteriaItem = this.model.userCriteria.find(item => item.columnName === selector.column.name);
    if (criteriaItem) {
      const valueIndex = criteriaItem.columnValues.findIndex(pair => pair.value === chip.value);
      if (valueIndex >= 0) {
        criteriaItem.columnValues.splice(valueIndex, 1);
      }
    }
  }

  onAddClick(selector: ICriteriaValueSelector): void {
    this.openChipSelectionPanel(selector);
  }

  private async openChipSelectionPanel(selector: ICriteriaValueSelector): Promise<void> {
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

  public onSortByAddClick(): void {
    const chipSelectionModel: IChipSelectionModel = {
      selector: this.sortBySelector,
      onOk: values => {
        // Each value corresponds to a field, so each value needs its own criteria item
        this.model.sortingCriteria = new CriteriaItems();
        for (const valuePair of values) {
          this.model.sortingCriteria.addSorting(valuePair.value);
        }
      }
    };
    this.chipSelectionService.showInPanel(chipSelectionModel);
  }

  public getSelectedSortValues(): IValuePair[] {
    const result: IValuePair[] = [];
    const sortedItems = this.utilities.sort(this.model.sortingCriteria, 'sortSequence');
    for (const criteriaItem of sortedItems) {
      result.push({
        value: criteriaItem.columnName,
        caption: this.db.displayName(criteriaItem.columnName)
      });
    }
    return result;
  }

  public onSortCloseClick(criteriaItem: CriteriaItem): void {
    // Remove sorting
    const index =
      this.model.sortingCriteria.findIndex(item =>
      item.columnName === criteriaItem.columnName &&
      item.sortSequence === criteriaItem.sortSequence);

    if (index >= 0) {
      this.model.sortingCriteria.splice(index, 1);
    }
  }

  public columnCaption(columnName: string): string {
    return this.db.displayName(columnName);
  }

  public onAlgorithmEditClick(): void {
    const chipSelectionModel: IChipSelectionModel = {
      selector: this.transformSelector,
      onOk: values => {
        // Only one value should be selected
        const selectedValuePair = values[0];
        this.model.transformAlgorithm = selectedValuePair.value;
      }
    };
    this.chipSelectionService.showInPanel(chipSelectionModel);
  }

  public algorithmCaption(algorithm: CriteriaTransformAlgorithm): string {
    const valuePair = this.transformSelector.values.find(item => item.value === algorithm);
    if (valuePair) {
      return valuePair.caption;
    }
    return '';
  }
}
