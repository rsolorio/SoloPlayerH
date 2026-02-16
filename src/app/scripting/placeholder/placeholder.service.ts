import { Injectable } from '@angular/core';
import { IParseInformation } from '../script-parser/script-parser.interface';

@Injectable({
  providedIn: 'root'
})
export class PlaceholderService {
  private placeholderLimiter = '%';
  /**
   * \% Matches a '%' character
   * \w Matches any word character (alphanumeric & underscore)
   * .  Matches any character, including dots, except line breaks
   * +  Match 1 or more of the preceding token
   * \% Matches a '%' character
   */
  private placeholderPattern = `\\${this.placeholderLimiter}\\w.+\\${this.placeholderLimiter}`;
  private placeholderRegExp = new RegExp(this.placeholderPattern, 'g');
  private placeholderLimiterRegExp = new RegExp(this.placeholderLimiter, 'g');
  constructor() { }

  public format(placeholderName: string): string {
    return this.placeholderLimiter + placeholderName.trim() + this.placeholderLimiter;
  }

  /**
   * Gets the value (token) from the specified context using the placeholder key.
   * Assumes the expression represents the placeholder pattern.
   */
  public getToken(info: IParseInformation): any {
    // TODO: log when token values are not found
    const placeholderName = info.expression.replace(this.placeholderLimiterRegExp, '');
    if (info.mappings) {
      const mapping = info.mappings[placeholderName];
      if (mapping) {
        return info.context[mapping];
      }
    }
    // This support nested properties
    return placeholderName.split('.').reduce((acc, part) => acc && acc[part], info.context);
  }

  public parse(info: IParseInformation): any {
    let parsedExpression = info.expression;
    const placeholderMatches = parsedExpression.match(this.placeholderRegExp);
    if (placeholderMatches?.length) {
      if (placeholderMatches.length === 1 && placeholderMatches[0] === parsedExpression) {
        // This is the case where the placeholder fully matches the expression
        // so return the value in the original data type instead of converting to string
        const placeholderValue = this.getToken({ expression: placeholderMatches[0], context: info.context, mappings: info.mappings });
        if (placeholderValue === undefined || placeholderValue === null) {
          // Returning an empty string is easier to handle
          return '';
        }
        return placeholderValue;
      }
      else {
        for (const placeholderMatch of placeholderMatches) {
          const placeholderValue = this.getToken({ expression: placeholderMatch, context: info.context, mappings: info.mappings });
          if (placeholderValue === undefined || placeholderValue === null) {
            // Just remove the placeholder to represent that there's no value
            parsedExpression = parsedExpression.replace(placeholderMatch, '');
          }
          else {
            parsedExpression = parsedExpression.replace(placeholderMatch, placeholderValue.toString());
          }
        }
      }
    }
    return parsedExpression;
  }
}
