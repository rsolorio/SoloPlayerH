import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoute } from 'src/app/app-routes';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { IValuePair } from 'src/app/core/models/core.interface';
import { CoreEvent } from 'src/app/core/services/events/events.enum';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ChipDisplayMode, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionService } from 'src/app/shared/components/chip-selection/chip-selection.service';
import { CriteriaSortDirection } from 'src/app/shared/models/criteria-base-model.interface';
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
  public CriteriaSortDirection = CriteriaSortDirection;
  public model: Criteria;
  public supportedSelectors: ICriteriaValueSelector[] = [];
  public sortBySelector: ICriteriaValueSelector;
  public limitSelector: ICriteriaValueSelector;
  public transformSelector: ICriteriaValueSelector;
  constructor(
    private db: DatabaseService,
    private utilities: UtilityService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private navbarService: NavBarStateService,
    private chipSelectionService: ChipSelectionService,
    private loadingService: LoadingViewStateService,
    private events: EventsService
  ) { }

  ngOnInit(): void {
    this.loadingService.show();
    this.navbarService.showBackIcon(() => {
      const previous = this.navigation.previous();
      if (previous?.options?.criteria && this.model) {
        previous.options.criteria = this.model;
      }
    });
    this.initializeNavbar();
    this.setupSelectors().then(criteria => {
      if (criteria) {
        this.model = criteria;
        this.setupSelectorVisibility();
      }
      else {
        // Go to home
        this.navigation.forward(AppRoute.Home);
      }
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
    if (!previousNavInfo) {
      return null;
    }
    if (previousNavInfo.route === AppRoute.Songs) {
      this.supportedSelectors = [
        this.db.selector(DbColumn.Rating),
        this.db.selector(DbColumn.Mood),
        this.db.selector(DbColumn.Language),
        this.db.selector(DbColumn.Favorite),
        this.db.selector(DbColumn.Live),
        this.db.selector(DbColumn.ReleaseDecade),
        this.db.selector(DbColumn.Lyrics)
      ];
    }

    const criteriaClone = previousNavInfo.options.criteria.clone();
    await this.updateSelectedValues(criteriaClone);
    return criteriaClone;
  }

  private async updateSelectedValues(criteria: Criteria): Promise<void> {
    for (const selector of this.supportedSelectors) {
      const criteriaItem = criteria.userCriteria.find(item => item.columnName === selector.column.name);
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
      const criteriaItem = criteria.sortingCriteria.find(item => item.columnName === valuePair.value);
      valuePair.selected = criteriaItem && criteriaItem.sortSequence > 0;
    }
    // Limit
    this.limitSelector = this.db.selector(DbColumn.Limit);
    this.limitSelector.values = await this.limitSelector.getValues();
    for (const valuePair of this.limitSelector.values) {
      valuePair.selected = valuePair.value === criteria.paging.pageSize;
    }
    // Transform
    this.transformSelector = this.db.selector(DbColumn.TransformAlgorithm);
    this.transformSelector.values = await this.transformSelector.getValues();
    for (const valuePair of this.transformSelector.values) {
      valuePair.selected = valuePair.value === criteria.transformAlgorithm;
    }
  }

  private setupSelectorVisibility(): void {
    for (const selector of this.supportedSelectors) {
      selector.hidden = !this.hasSelectedValues(selector);
    }
    // Special validation for sort by
    this.sortBySelector.hidden = !this.model.sortingCriteria.hasSorting();
    // Special validation for limit
    this.limitSelector.hidden = this.limitSelector.defaultValue !== undefined && this.limitSelector.defaultValue === this.model.paging.pageSize;
    // Special validation for transform
    this.transformSelector.hidden = this.transformSelector.defaultValue !== undefined && this.transformSelector.defaultValue === this.model.transformAlgorithm;
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
        },
        {
          caption: 'Restore',
          icon: 'mdi-restore mdi',
          action: () => {}
        },
        {
          caption: 'Cancel',
          icon: 'mdi-cancel mdi',
          action: () => {
            this.events.broadcast(CoreEvent.NavbarBackRequested);
          }
        }
      ],
      title: 'Filter Setup',
      leftIcon: {
        icon: 'mdi-filter-outline mdi'
      },
      rightIcon: {
        icon: 'mdi-plus mdi',
        action: () => {          
          this.openFieldSelectionPanel();
        }
      }
    });
  }

  /**
   * Looks for criteria values that match the column name associated with the selector.
   */
  getSelectedValues(selector: ICriteriaValueSelector): IValuePair[] {
    const criteriaItem = this.model.userCriteria.find(item => item.columnName === selector.column.name);
    if (criteriaItem) {
      return criteriaItem.columnValues;
    }
    return [];
  }

  /**
   * Determines if the column name associated with the selector is being used in the criteria;
   * the default value configured in the selector is ignored from the existing values.
   */
  hasSelectedValues(selector: ICriteriaValueSelector): boolean {
    const values = this.getSelectedValues(selector);
    if (!values.length) {
      return false;
    }
    if (values.length === 1 && selector.defaultValue !== undefined && values[0] === selector.defaultValue) {
      return false;
    }
    return true;
  }

  onChipCloseClick(selector: ICriteriaValueSelector, chip: IValuePair): void {
    const criteriaItem = this.model.userCriteria.find(item => item.columnName === selector.column.name);
    if (criteriaItem) {
      const valueIndex = criteriaItem.columnValues.findIndex(pair => pair.value === chip.value);
      if (valueIndex >= 0) {
        criteriaItem.columnValues.splice(valueIndex, 1);
        this.doAfterCriteriaValuesUpdated(selector, criteriaItem);
      }
    }
  }

  onAddEditClick(selector: ICriteriaValueSelector): void {
    this.openChipSelectionPanel(selector);
  }

  private async openChipSelectionPanel(selector: ICriteriaValueSelector): Promise<void> {
    await this.updateSelectedValues(this.model);
    const chipSelectionModel: IChipSelectionModel = {
      displayMode: ChipDisplayMode.Flex,
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
        this.doAfterCriteriaValuesUpdated(selector, criteriaItem);
      }
    };

    this.chipSelectionService.showInPanel(chipSelectionModel);
  }

  private doAfterCriteriaValuesUpdated(selector: ICriteriaValueSelector, criteriaItem: CriteriaItem): void {
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

  private openFieldSelectionPanel(): void {
    const allSelectors = [...this.supportedSelectors, this.sortBySelector, this.limitSelector, this.transformSelector];
    // Prepare the model
    const chipSelectionModel: IChipSelectionModel = {
      displayMode: ChipDisplayMode.Block,
      selector: {
        column: { name: 'field', caption: 'Criteria Fields', dataType: CriteriaDataType.String },
        values: [],
        editor: CriteriaValueEditor.Multiple,
        getValues: null
      },
      onOk: values => {
        values.forEach(valuePair => {
          const selector = allSelectors.find(s => s.column.name === valuePair.value);
          if (selector) {
            selector.hidden = false;
          }
        });
      }
    };
    // Send hidden selectors as available values
    allSelectors.filter(s => s.hidden).forEach(selector => {
      chipSelectionModel.selector.values.push({ value: selector.column.name, caption: selector.column.caption });
    });
    this.chipSelectionService.showInPanel(chipSelectionModel);
  }

  public onSortByAddClick(): void {
    this.openSortBySelectionPanel();
  }

  private async openSortBySelectionPanel(): Promise<void> {
    await this.updateSelectedValues(this.model);
    const chipSelectionModel: IChipSelectionModel = {
      displayMode: ChipDisplayMode.Flex,
      selector: this.sortBySelector,
      onOk: values => {
        // Each value corresponds to a field, so each value needs its own criteria item
        this.model.sortingCriteria = new CriteriaItems();
        const sortedValues = this.utilities.sort(values, 'sequence');
        for (const valuePair of sortedValues) {
          this.model.sortingCriteria.addSorting(valuePair.value);
        }
      }
    };
    this.chipSelectionService.showInPanel(chipSelectionModel);
  }

  public getSortingCriteria(): CriteriaItem[] {
    return this.utilities.sort(this.model.sortingCriteria, 'sortSequence');
  }

  public onSortRemoveClick(criteriaItem: CriteriaItem): void {
    // Remove sorting
    const index =
      this.model.sortingCriteria.findIndex(item =>
      item.columnName === criteriaItem.columnName &&
      item.sortSequence === criteriaItem.sortSequence);

    if (index >= 0) {
      this.model.sortingCriteria.splice(index, 1);
    }
  }

  public onSortDirectionClick(criteriaItem: CriteriaItem): void {
    if (criteriaItem.sortDirection === CriteriaSortDirection.Descending) {
      criteriaItem.sortDirection = CriteriaSortDirection.Ascending;
    }
    else {
      criteriaItem.sortDirection = CriteriaSortDirection.Descending;
    }
  }

  public columnCaption(columnName: string): string {
    return this.db.displayName(columnName);
  }

  public onLimitEditClick(): void {
    const chipSelectionModel: IChipSelectionModel = {
      displayMode: ChipDisplayMode.Flex,
      selector: this.limitSelector,
      onOk: values => {
        // Only one value should be selected
        const selectedValuePair = values[0];
        this.model.paging.pageSize = selectedValuePair.value;
      }
    };
    this.chipSelectionService.showInPanel(chipSelectionModel);
  }

  public limitCaption(limit: number): string {
    const valuePair = this.limitSelector.values.find(item => item.value === limit);
    if (valuePair) {
      return valuePair.caption;
    }
    return limit.toString();
  }

  public onAlgorithmEditClick(): void {
    const chipSelectionModel: IChipSelectionModel = {
      displayMode: ChipDisplayMode.Flex,
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
