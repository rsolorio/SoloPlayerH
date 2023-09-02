import { Injectable } from '@angular/core';
import { IParseInformation } from './parser.interface';
import { FunctionService } from '../function/function.service';
import { PlaceholderService } from '../placeholder/placeholder.service';

@Injectable({
  providedIn: 'root'
})
export class ParserService {
  constructor(private functions: FunctionService, private placeholders: PlaceholderService) { }

  public parse(info: IParseInformation): any {
    const functionsResult = this.functions.parse({
      expression: info.expression,
      context: this.addPredefinedPlaceholders(info.context),
      mappings: info.mappings });
    const placeholdersResult = this.placeholders.parse(functionsResult);
    return placeholdersResult;
  }

  /**
   * Adds the following placeholders: comma, percentage, dollar, space, openParen, closeParen.
   */
  private addPredefinedPlaceholders(context: any): any {
    // TODO: should we add more specific names like 'p-comma' to prevent colliding with
    // properties from the original context?
    const result = Object.assign({}, context);
    result['comma'] = ',';
    result['percentage'] = '%';
    result['dollar'] = '$';
    result['space'] = ' ';
    result['openParen'] = '(';
    result['closeParen'] = ')';
    return result;
  }
}
