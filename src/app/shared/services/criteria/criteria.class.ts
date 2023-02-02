import { CriteriaComparison, CriteriaJoinOperator, CriteriaSortDirection, CriteriaSortingAlgorithm } from "./criteria.enum";

export class Criteria {
  paging = new CriteriaPaging();
  /** Read only criteria needed by the system to properly retrieve the expected results. */
  systemCriteria = new CriteriaItems();
  /** Criteria that comes from breadcrumbs. */
  breadcrumbCriteria = new CriteriaItems();
  /** Any generic criteria to perform a search. */
  searchCriteria = new CriteriaItems();
  /** Extra criteria specified by the user. */
  userCriteria = new CriteriaItems();
  /** Criteria for specifying sorting to the final filter. */
  sortingCriteria = new CriteriaItems();
  /** Algorithm to perform a special sort in the list of items. */
  sortingAlgorithm = CriteriaSortingAlgorithm.None;
  /** Date on which this object was created. The value is represented in milliseconds according to the getTime method. */
  date = new Date().getTime();

  public clone(): Criteria {
    const criteriaText = JSON.stringify(this);
    const result = new Criteria();
    Object.assign(result, JSON.parse(criteriaText));
    result.date = new Date().getTime();
    return result;
  }

  public hasItems(): boolean {
    return this.systemCriteria.length > 0 ||
      this.breadcrumbCriteria.length > 0 ||
      this.searchCriteria.length > 0 ||
      this.userCriteria.length > 0 ||
      this.sortingCriteria.length > 0;
  }

  public hasComparison(ignoreSystem?: boolean, columnName?: string) {
    let result =
      this.breadcrumbCriteria.hasComparison(columnName) || this.searchCriteria.hasComparison(columnName) || this.userCriteria.hasComparison(columnName);
    if (!ignoreSystem) {
      result = result || this.systemCriteria.hasComparison(columnName);
    }
    return result;
  }

  public hasSorting(): boolean {
    return this.sortingCriteria.hasSorting();
  }

  public addSorting(columnName: string, sortDirection?: CriteriaSortDirection): void {
    this.sortingCriteria.addSorting(columnName, sortDirection);
  }

  public ignoredInSelect(columnName: string): boolean {
    return this.systemCriteria.ignoredInSelect(columnName) ||
      this.breadcrumbCriteria.ignoredInSelect(columnName) ||
      this.searchCriteria.ignoredInSelect(columnName) ||
      this.userCriteria.ignoredInSelect(columnName);
  }
}

export class CriteriaPaging {
  /** If SELECT DISTINCT should be applied. */
  distinct = false;
  /** The number of items for each page. If this is not set or zero paging will be disabled. */
  pageSize = 0;
  /** If the results are paged, this value represents the page that will be loaded. */
  pageNumber = 1;

  constructor(distinct?: boolean, pageSize?: number, pageNumber?: number) {
    if (pageSize !== undefined) {
      this.pageSize = pageSize;
    }
    if (pageNumber !== undefined) {
      this.pageNumber = pageNumber;
    }
    if (distinct !== undefined) {
      this.distinct = distinct;
    }
  }
}

export class CriteriaItem {
  /** The name of the column. */
  columnName: string;
  /** The values to compare the column to. */
  columnValues: any[] = [];
  /** The comparison operator between the column and the value. */
  comparison = CriteriaComparison.Equals;
  /** The join operator that will be used to chain all comparisons of the same column with multiple values. */
  valuesOperator = CriteriaJoinOperator.Auto;
  /** The join operator to chain this expression with the previous expression. */
  expressionOperator = CriteriaJoinOperator.Auto;
  /** Sort direction in case sorting is enabled. */
  sortDirection = CriteriaSortDirection.Ascending;
  /** Column sequence in the sort clause, starting with 1. 0 means no sorting. */
  sortSequence = 0;
  /** If the column being used in the criteria should be excluded from the SELECT clause. */
  ignoreInSelect = false;
  /** A human readable representation of the column associated with this criteria. */
  displayName: string;
  /** A human readable representation of the value associated with this criteria. */
  displayValue: string;

  constructor(columnName: string, columnValue?: any, comparison?: CriteriaComparison) {
    this.columnName = columnName;
    if (columnValue !== undefined) {
      this.columnValues.push(columnValue);
    }
    if (comparison === undefined) {
      if (columnValue === undefined) {
        this.comparison = CriteriaComparison.None;
      }
    }
    else {
      this.comparison = comparison;
    }
  }
}

export class CriteriaItems extends Array<CriteriaItem> {

  public hasComparison(columnName?: string): boolean {
    if (columnName) {
      const items = this.filter(item => item.columnName === columnName);
      for (const item of items) {
        if (item.comparison !== CriteriaComparison.None) {
          return true;
        }
      }
      return false;
    }
    return this.filter(item => item.comparison !== CriteriaComparison.None).length > 0;
  }

  public hasSorting(): boolean {
    return this.filter(item => item.sortSequence > 0).length > 0;
  }

  public addSorting(columnName: string, sortDirection?: CriteriaSortDirection): void {
    // Determine last sequence
    let lastSequence = 0;
    for (const criteriaItem of this) {
      if (criteriaItem.sortSequence > lastSequence) {
        lastSequence = criteriaItem.sortSequence;
      }
    }
    // Find existing column
    let criteriaItem = this.find(item => item.columnName === columnName);
    // Add if it does not exist
    if (!criteriaItem) {
      criteriaItem = new CriteriaItem(columnName);
      criteriaItem.comparison = CriteriaComparison.None;
      this.push(criteriaItem);
    }
    if (sortDirection) {
      criteriaItem.sortDirection = sortDirection;
    }
    criteriaItem.sortSequence = lastSequence + 1;
  }

  public ignoredInSelect(columnName: string): boolean {
    return this.filter(item => item.columnName === columnName && item.ignoreInSelect).length > 0;
  }
}