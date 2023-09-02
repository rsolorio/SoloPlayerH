import { Injectable } from '@angular/core';
import { IParseInformation } from '../script-parser/script-parser.interface';

@Injectable({
  providedIn: 'root'
})
export class PlaceholderService {
  public get limiter(): string {
    return '%';
  }

  constructor() { }

  public format(placeholderName: string): string {
    return this.limiter + placeholderName.trim() + this.limiter;
  }

  /**
   * Gets the value (token) from the specified context using the placeholder key.
   * Assumes the expression represents the placeholder pattern.
   */
  public getToken(info: IParseInformation): any {
    const placeholderName = info.expression.replace(new RegExp(this.limiter, 'g'), '');
    if (info.mappings) {
      const mapping = info.mappings[placeholderName];
      if (mapping) {
        return info.context[mapping];
      }
    }
    return info.context[placeholderName];
  }

  public parse(info: IParseInformation): any {
    let parsedExpression = info.expression;
    const regExpPattern = `\\${this.limiter}\\w+\\${this.limiter}`;
    const placeholderRegExp = new RegExp(regExpPattern, 'g');
    const placeholderMatches = parsedExpression.match(placeholderRegExp);
    if (placeholderMatches?.length) {
      if (placeholderMatches.length === 1 && placeholderMatches[0] === parsedExpression) {
        // This is the case where the placeholder fully matches the expression
        // so return the value in the original data type instead of converting to string
        const placeholderValue = this.getToken({ expression: placeholderMatches[0], context: info.context, mappings: info.mappings });
        if (placeholderValue !== undefined && placeholderValue !== null) {
          return placeholderValue;
        }
        // Leave the placeholder since we did not find a value
        return parsedExpression;
      }
      else {
        for (const placeholderMatch of placeholderMatches) {
          const placeholderValue = this.getToken({ expression: placeholderMatch, context: info.context, mappings: info.mappings });
          if (placeholderValue !== undefined && placeholderValue !== null) {
            parsedExpression = parsedExpression.replace(placeholderMatch, placeholderValue.toString());
          }
          else {
            // Leave the placeholder there if no value was found
          }
        }
      }
    }
    return parsedExpression;
  }
}
