import {
  CriteriaOperator,
  CriteriaSortDirection,
  ICriteriaBaseModel,
  ICriteriaValueBaseModel
} from './criteria-base-model.interface';

export class CriteriaBase implements ICriteriaBaseModel {
  // We don't always need this but it is better to have it
  public SelectDistinct = true;
  public RandomOrder = false;
  public MaximumRows = 0;
  public PageNumber = 1;

  constructor(maximumRows?: number, pageNumber?: number, selectDistinct?: boolean, randomOrder?: boolean) {
    if (maximumRows !== undefined) {
      this.MaximumRows = maximumRows;
    }
    if (pageNumber !== undefined) {
      this.PageNumber = pageNumber;
    }
    if (selectDistinct !== undefined) {
      this.SelectDistinct = selectDistinct;
    }
    if (randomOrder !== undefined) {
      this.RandomOrder = randomOrder;
    }
  }
}

export class CriteriaValueBase implements ICriteriaValueBaseModel {
  // Exposing fields as public properties since
  // making them private and exposing as getter/setter will not get properties serialized
  public ColumnName: string = null;
  public ColumnValue;
  public Operator = CriteriaOperator.Equals;
  public OrOperator = false;
  public SortDirection = CriteriaSortDirection.Ascending;
  public SortSequence = 0;

  constructor(columnName: string, columnValue?: any, operator?: CriteriaOperator) {
    this.ColumnName = columnName;
    if (columnValue !== undefined) {
      this.ColumnValue = columnValue;
    }
    if (operator !== undefined) {
      this.Operator = operator;
    }
  }
}

export function hasAnyCriteria(criteria: ICriteriaValueBaseModel[]): boolean {
  return criteria && criteria.filter(item => item.Operator !== CriteriaOperator.None).length > 0;
}

export function hasCriteria(columnName: string, criteria: ICriteriaValueBaseModel[]): boolean {
  if (criteria && criteria.length) {
    const items = criteria.filter(item => item.ColumnName === columnName);
    for (const criteriaItem of items) {
      if (criteriaItem.Operator !== CriteriaOperator.None) {
        return true;
      }
    }
  }
  return false;
}

export function hasSorting(criteria: ICriteriaValueBaseModel[]): boolean {
  return criteria.filter(item => item.SortSequence > 0).length > 0;
}

export function addSorting(columnName: string, sortDirection: CriteriaSortDirection, criteria: ICriteriaValueBaseModel[]): void {
  // Determine last sequence
  let lastSequence = 0;
  for (const criteriaItem of criteria) {
    if (criteriaItem.SortSequence > lastSequence) {
      lastSequence = criteriaItem.SortSequence;
    }
  }
  // Find existing column
  let criteriaItem = criteria.find(item => item.ColumnName === columnName);
  // Add if it does not exist
  if (!criteriaItem) {
    criteriaItem = new CriteriaValueBase(columnName);
    criteriaItem.Operator = CriteriaOperator.None;
    criteria.push(criteriaItem);
  }
  criteriaItem.SortDirection = sortDirection;
  criteriaItem.SortSequence = lastSequence + 1;
}
