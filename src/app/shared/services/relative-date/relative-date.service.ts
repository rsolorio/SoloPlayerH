import { Injectable } from '@angular/core';
import { IRelativeDateExpression, IRelativeDateValue } from './relative-date.interface';
import { RelativeDateOperator, RelativeDateTerm, RelativeDateUnit } from './relative-date.enum';
import { IDateRange } from 'src/app/core/models/core.interface';

/**
 * Service that parses relative dates.
 * Parsing a relative date returns a period of time.
 * The supported syntax is: [Term] [Operator] [Unit and Quantity].
 * Term (required): a relative period of time.
 * Operator (optional): specifies if the period will be moved or extended.
 * Unit and Quantity (optional): the amount of time the period will change.
 * 
 * Expressions with move operators:
 * - the period of time is defined by the term
 * - the operator will move the date back or forth based on the unit and quantity
 * 
 * Expressions with extend operators:
 * - the period of time is defined by the unit and quantity
 * - the operator will extend the original period specified by the term
 * 
 * In relative dates, the date range will always specify the properties:
 * - from: start (00:00:00 hrs) of a given day
 * - to: end (23:59:59 hrs) of a given day
 */
@Injectable({
  providedIn: 'root'
})
export class RelativeDateService {

  constructor() { }

  public createExpression(text: string): IRelativeDateExpression {
    const result: IRelativeDateExpression = {
      original: null,
      excess: '',
      term: null,
      operator: null,
      value: null
    };

    if (!text) {
      return;
    }

    const values = text.split(' ');

    for (let index = 0; index < values.length; index++) {
      const value = values[index];
      // The first item must be the term
      if (index === 0) {
        // Make sure the term matches a valid value
        Object.values(RelativeDateTerm).forEach(t => {
          if (t === value.toLowerCase()) {
            result.term = t;
          }
        });
        // If no term found, stop
        if (!result.term) {
          break;
        }
      }
      else if (index === 1) {
        Object.values(RelativeDateOperator).forEach(o => {
          if (o === value) {
            result.operator = o;
          }
        });
        // If no operator found, stop
        if (!result.operator) {
          break;
        }
      }
      else if (index === 2) {
        Object.values(RelativeDateUnit).forEach(u => {
          const relativeValue = this.createValue(value);
          if (relativeValue.quantity) {
            result.value = relativeValue;
          }
        });
        // If no value found, stop
        if (!result.value) {
          break;
        }
      }
      else {
        result.excess += value + ' ';
      }
    }

    return result;
  }

  /**
   * Determines if a relative date expression is valid.
   * It evaluates the expression doesn't have an excess and it does have at least a term specified;
   * the operator and the value are optional data.
   */
  public isValid(expression: IRelativeDateExpression): boolean {
    return !expression.excess && !!expression.term;
  }

  /**
   * Determines if the relative date expression is a complex expression which means it has, not only the term
   * but also an operator and a value.
   */
  public isComplex(expression: IRelativeDateExpression): boolean {
    return !!expression.term && !!expression.operator && expression.value.quantity !== 0;
  }

  public parse(expression: IRelativeDateExpression): IDateRange {
    // This is the date range of the term
    const result = this.parseTerm(expression.term);

    // Now adjust the range based on the operator and value
    if (this.isComplex(expression)) {
      switch (expression.operator) {
        // Example: td + 1d = from: tomorrow, to: tomorrow
        case RelativeDateOperator.Plus:
          result.from = this.addUnits(result.from, expression.value);
          result.to = this.addUnits(result.to, expression.value);
          break;
        // Example: td - 1y = from: one year back same day, to: one year back same day
        case RelativeDateOperator.Minus:
          result.from = this.addUnits(result.from, expression.value, true);
          result.to = this.addUnits(result.to, expression.value, true);
          break;
      }
    }

    return result;
  }

  private parseTerm(term: RelativeDateTerm): IDateRange {
    const now = new Date();
    if (term === RelativeDateTerm.ThisDay) {
      return {
        from: this.startOfDay(now),
        to: this.endOfDay(now)
      };
    }

    if (term === RelativeDateTerm.ThisMonth) {
      return {
        from: this.startOfMonth(now),
        to: this.endOfMonth(now)
      }
    }
    else if (term === RelativeDateTerm.ThisYear) {
      return {
        from: this.startOfYear(now),
        to: this.endOfYear(now)
      }
    }
    return null;
  }

  public createValue(expression: string): IRelativeDateValue {
    const result: IRelativeDateValue = {
      expression: expression,
      unit: null,
      quantity: 0
    };

    if (expression) {
      for (const unit of Object.values(RelativeDateUnit)) {
        if (expression.toLowerCase().endsWith(unit)) {
          result.unit = unit;
          if (expression === unit) {
            result.quantity = 1;
          }
          else {
            const text = expression.substring(0, expression.length - unit.length);
            const value = parseInt(text, 10);
            if (value) {
              result.quantity = value;
            }
          }
        }
      }
    }

    return result;
  }

  // Date calculations info
  // The month value is zero-index based, so Jan is 0 and Dec is 11.
  // A value of 0 in the day moves the date one day back
  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private endOfMonth(date: Date): Date {
    return this.endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  }

  private startOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0);
  }

  private endOfYear(date: Date): Date {
    return this.endOfDay(new Date(date.getFullYear() + 1, 0, 0));
  }

  private addUnits(date: Date, value: IRelativeDateValue, isNegative?: boolean): Date {
    let quantity = value.quantity;
    if (isNegative) {
      quantity *= -1;
    }

    switch (value.unit) {
      case RelativeDateUnit.Day:
        var newDay = new Date(date.getTime());
        newDay.setDate(date.getDate() + quantity);
        return newDay;
      case RelativeDateUnit.Month:
        var newMonth = new Date(date.getTime());
        newMonth.setMonth(date.getMonth() + quantity);
        return newMonth;
      case RelativeDateUnit.Year:
        var newYear = new Date(date.getTime());
        newYear.setFullYear(date.getFullYear() + quantity);
        return newYear;
    }
    return null;
  }
}
