import { IValuePair } from "src/app/core/models/core.interface";
import { CriteriaComparison, CriteriaJoinOperator, CriteriaSortDirection, CriteriaTransformAlgorithm } from "./criteria.enum";

/**
 * Criteria object.
 */
export class Criteria {
  paging = new CriteriaPaging();
  /** Read only criteria needed by the system to properly retrieve the expected results. For Filter entities and for default criteria on broadcast services. */
  systemCriteria = new CriteriaItems();
  /** Criteria that comes from breadcrumbs. */
  breadcrumbCriteria = new CriteriaItems();
  /** Any generic criteria to perform a search usually trough a search box. */
  searchCriteria = new CriteriaItems();
  /** Extra criteria specified by the user; also used to specify generic filters picked by the user. */
  userCriteria = new CriteriaItems();
  /** Criteria for quick filters. */
  quickCriteria = new CriteriaItems();
  /** Criteria for specifying sorting to the final filter. */
  sortingCriteria = new CriteriaItems();
  /** Algorithm to perform a special sort in the list of items. */
  transformAlgorithm = CriteriaTransformAlgorithm.None;
  /** Date on which this object was created. The value is represented in milliseconds according to the getTime method. */
  date: number;
  /** Unique identifier of this object. */
  id: string;
  /** A descriptive name for this object. */
  name: string;
  /** Determines if the results should be returned in random order. If this flag is on, sorting criteria will be ignored. */
  random = false;
  /** Unique identifier of the filter associated with this object. */
  filterId: string;

  constructor(name?: string) {
    this.name = name;
    this.setId();
  }

  public clone(): Criteria {
    const result = new Criteria(this.name);
    result.paging = Object.assign(result.paging, JSON.parse(JSON.stringify(this.paging)));
    result.systemCriteria = this.systemCriteria.clone();
    result.breadcrumbCriteria = this.breadcrumbCriteria.clone();
    result.searchCriteria = this.searchCriteria.clone();
    result.userCriteria = this.userCriteria.clone();
    result.quickCriteria = this.quickCriteria.clone();
    result.sortingCriteria = this.sortingCriteria.clone();
    result.transformAlgorithm = this.transformAlgorithm;
    result.random = this.random;
    return result;
  }

  /**
   * Determines if the object has any kind of criteria: system, breadcrumb, search, user, quick, sorting.
   */
  public hasItems(): boolean {
    return this.systemCriteria.length > 0 ||
      this.breadcrumbCriteria.length > 0 ||
      this.searchCriteria.length > 0 ||
      this.userCriteria.length > 0 ||
      this.quickCriteria.length > 0 ||
      this.sortingCriteria.length > 0;
  }

  /**
   * Determines if the object has a distinct clause enabled, multiple page numbers or a specific page size.
   */
  public hasPaging(): boolean {
    return this.paging.distinct || this.paging.pageNumber > 1 || this.paging.pageSize > 0;
  }

  public hasComparison(ignoreSystem?: boolean, columnName?: string) {
    let result =
      this.breadcrumbCriteria.hasComparison(columnName) || this.searchCriteria.hasComparison(columnName) || this.userCriteria.hasComparison(columnName) || this.quickCriteria.hasComparison(columnName);
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
      this.userCriteria.ignoredInSelect(columnName) ||
      this.quickCriteria.ignoredInSelect(columnName);
  }

  /**
   * Sets the id and date properties of the object.
   * Id example: 2023-01-10|11:25:33:990
   */
  private setId(): void {
    const now = new Date();
    const yearText = now.toLocaleString('default', { year: 'numeric'});
    const monthText = now.toLocaleString('default', { month: '2-digit'});
    const dayText = now.toLocaleString('default', { day: '2-digit'});
    const hoursText = now.getHours().toLocaleString('default', { minimumIntegerDigits: 2});
    const minutesText = now.getMinutes().toLocaleString('default', { minimumIntegerDigits: 2});
    const secondsText = now.getSeconds().toLocaleString('default', { minimumIntegerDigits: 2});
    const msText = now.getMilliseconds().toLocaleString('default', { minimumIntegerDigits: 3 });
    this.id = `${yearText}-${monthText}-${dayText}|${hoursText}:${minutesText}:${secondsText}:${msText}`;
    this.date = now.getTime();
  }
}

/**
 * CriteriaPaging object.
 */
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

/**
 * CriteriaItem object.
 */
export class CriteriaItem {
  /** Unique identifier of this object. */
  id: string;
  /** The name of the column. */
  columnName: string;
  /** The values to compare the column to. */
  columnValues: IValuePair[] = [];
  /** Determines if the column values are special expressions that describe a relative date. */
  isRelativeDate: boolean;
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
      this.columnValues.push({
        value: columnValue,
        caption: columnValue.toString()
      });
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

/**
 * CriteriaItems object.
 */
export class CriteriaItems extends Array<CriteriaItem> {
  /** Uniquely identifies a list of criteria items. */
  id: string;
  public clone(): CriteriaItems {
    const itemsText = JSON.stringify(this);
    const result = new CriteriaItems();
    Object.assign(result, JSON.parse(itemsText));
    return result;
  }

  public clear(): void {
    this.length = 0;
  }

  public hasComparison(columnName?: string): boolean {
    if (columnName) {
      return this.getComparisons().filter(item => item.columnName === columnName).length > 0;
    }
    return this.getComparisons().length > 0;
  }

  public getComparisons(): CriteriaItem[] {
    const result: CriteriaItem[] = [];
    const itemsWithComparison = this.filter(item => item.comparison !== CriteriaComparison.None);
    for (const item of itemsWithComparison) {
      if (item.comparison === CriteriaComparison.IsNull || item.comparison === CriteriaComparison.IsNotNull) {
        // These comparisons do not need a list of values to compare to
        result.push(item);
      }
      else if (item.columnValues.length) {
        // The rest need a list of values to compare to
        result.push(item);
      }
    }
    return result;
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

  public addIgnore(columnName: string): CriteriaItem {
    let criteriaItem = this.find(item => item.columnName === columnName);
    if (criteriaItem) {
      criteriaItem.ignoreInSelect = true;
    }
    else {
      criteriaItem = new CriteriaItem(columnName);
      criteriaItem.ignoreInSelect = true;
      this.push(criteriaItem);
    }
    return criteriaItem;
  }
}