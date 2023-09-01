import { Injectable } from '@angular/core';
import { IParseFunctionResult } from './parser.interface';
import { FunctionService } from '../function/function.service';

@Injectable({
  providedIn: 'root'
})
export class ParserService {
  constructor(private functions: FunctionService) { }

  public parse(expression: string, context: any, placeholderMapping?: any): any {
    const functionsResult = this.parseFunctions(expression, context);
    const placeholdersResult = this.parsePlaceholders(functionsResult.expression, functionsResult.context);
    return placeholdersResult;

    // Pre-defined fields:
    // %comma% %openparen% %closeparen% %percentage% %dollar% %null% %space%
  }

  private parseFunctions(expression: string, context: any): IParseFunctionResult {
    this.functions.resetCounter();
    const result: IParseFunctionResult = { expression: expression, context: context };
    const functionRegExp = new RegExp('\\$\\w+\\(', 'g');
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
          const parseArgumentsResult = this.parseFunctions(functionArguments, result.context);
          result.context = parseArgumentsResult.context;
          // At this point, the expression should only have placeholders
          // so now split without worrying about commas from other functions
          const argArray = parseArgumentsResult.expression.split(',');
          argArray.forEach(arg => {
            const argumentValue = this.parsePlaceholders(arg.trim(), result.context);
            args.push(argumentValue);
          });
        }
      }

      const fullFunctionExpression = result.expression.substring(functionIndex, closeParenthesisIndex + 1);
      const functionResult = this.functions.run(functionPrefix, args);
      if (functionResult) {
        // Replace the function with the placeholder
        result.expression = result.expression.replace(fullFunctionExpression, functionResult.placeholderPattern);
        // Add new context property for the function
        result.context = Object.assign({}, result.context);
        result.context[functionResult.placeholderName] = functionResult.value;
      }
      else {
        // Return a placeholder %null%
        result.expression = result.expression.replace(fullFunctionExpression, '%null%');
      }
      // Last step is to look for more functions
      functionMatches = result.expression.match(functionRegExp);
    }
    return result;
  }

  private parsePlaceholders(expression: string, context: any): string {
    let parsedExpression = expression;
    const placeholderRegExp = new RegExp('\\%\\w+\\%', 'g');
    const placeholderMatches = parsedExpression.match(placeholderRegExp);
    if (placeholderMatches?.length) {
      for (const placeholderMatch of placeholderMatches) {
        const placeholderName = placeholderMatch.replace(new RegExp('%', 'g'), '');
        const placeholderValue = context[placeholderName];
        if (placeholderValue !== undefined && placeholderValue !== null) {
          parsedExpression = parsedExpression.replace(placeholderMatch, placeholderValue.toString());
        }
        else {
          // Leave the placeholder there if no value was found
        }
      }
    }
    return parsedExpression;
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
