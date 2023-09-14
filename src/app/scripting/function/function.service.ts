import { Injectable } from '@angular/core';
import { IParseInformation } from '../script-parser/script-parser.interface';
import { PlaceholderService } from '../placeholder/placeholder.service';
import { FunctionDefinitionService } from './function-definition.service';

@Injectable({
  providedIn: 'root'
})
export class FunctionService {
  private functionPrefix = '$';
  constructor(
    private placeholders: PlaceholderService,
    private definitions: FunctionDefinitionService) { }

  public parse(info: IParseInformation): IParseInformation {
    this.definitions.resetCounter();
    const result: IParseInformation = { expression: info.expression, context: info.context, mappings: info.mappings };
    const regExpPattern = `\\${this.functionPrefix}\\w+\\(`;
    const functionRegExp = new RegExp(regExpPattern, 'g');
    let functionMatches = result.expression.match(functionRegExp);
    while (functionMatches?.length) {
      // Get the very first function match
      const functionPrefix = functionMatches[0];
      // Get the arguments of the function
      const functionIndex = result.expression.indexOf(functionPrefix);
      const openParenthesisIndex = functionIndex + functionPrefix.length - 1;
      const closeParenthesisIndex = this.findClosingParenthesis(result.expression, openParenthesisIndex + 1);
      let args = [];
      if (openParenthesisIndex < closeParenthesisIndex) {
        const functionArguments = result.expression.substring(openParenthesisIndex + 1, closeParenthesisIndex);
        if (functionArguments) {
          // Recursive call to parse functions one level deeper
          const parseArgumentsResult = this.parse({ expression: functionArguments, context: result.context, mappings: result.mappings });
          result.context = parseArgumentsResult.context;
          // At this point, the expression should only have placeholders
          // so now split without worrying about commas from other functions
          const argArray = parseArgumentsResult.expression.split(',');
          argArray.forEach(arg => {
            const argumentValue = this.placeholders.parse({ expression: arg.trim(), context: result.context, mappings: result.mappings });
            args.push(argumentValue);
          });
        }
      }

      const fullFunctionExpression = result.expression.substring(functionIndex, closeParenthesisIndex + 1);
      const functionResult = this.definitions.run(functionPrefix, args);
      if (functionResult) {
        // Replace the function with the placeholder
        result.expression = result.expression.replace(fullFunctionExpression, this.placeholders.format(functionResult.uniqueName));
        // Add new context property for the function
        result.context = Object.assign({}, result.context);
        result.context[functionResult.uniqueName] = functionResult.value;
      }
      else {
        // Just remove the placeholder indicating that it doesn't have any value
        result.expression = result.expression.replace(fullFunctionExpression, '');
      }
      // Last step is to look for more functions
      functionMatches = result.expression.match(functionRegExp);
    }
    return result;
  }

  private findClosingParenthesis(text: string, startIndex: number): number {
    let result = -1;
    let openCount = 0;
    for (let charIndex = startIndex; charIndex <= text.length; charIndex++) {
      const charValue = text[charIndex];
      if (charValue === '(') {
        openCount++;
      }
      else if (charValue === ')') {
        if (openCount) {
          openCount--;
        }
        else {
          result = charIndex;
          break;
        }
      }
    }
    return result;
  }
}
