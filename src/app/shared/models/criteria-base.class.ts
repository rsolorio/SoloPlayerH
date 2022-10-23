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
