import { Injectable } from '@angular/core';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IFunctionDefinition, IFunctionResult } from './function.interface';

@Injectable({
  providedIn: 'root'
})
export class FunctionDefinitionService {
  private nameSeparator = '_';
  private functionCounter = 0;
  private functions: IFunctionDefinition[] = [];
  constructor(private utility: UtilityService) {
    this.initializeFunctions();
  }

  public resetCounter(): void {
    this.functionCounter = 0;
  }

  public run(prefix: string, args: any[]): IFunctionResult {
    const definition = this.functions.find(f => f.syntax.startsWith(prefix));
    if (definition) {
      this.functionCounter++;
      return {
        name: definition.name,
        uniqueName: definition.name + this.nameSeparator + this.utility.enforceDigits(this.functionCounter, 2),
        value: definition.fn(args)
      };
    }
    return null;
  }

  private initializeFunctions(): void {
    this.ifFunction();
    this.andFunction();
    this.orFunction();
    this.digitsFunction();
    this.intFunction();
  }

  private ifFunction(): void {
    this.functions.push({
      name: 'if',
      syntax: '$if(x,y,z)',
      description: 'If x is true, y is returned, otherwise z.',
      fn: args => {
        const x = args[0];
        const y = args[1];
        const z = args[2];
        if (x) {
          return y;
        }
        return z;
      }
    });
  }

  private andFunction(): void {
    this.functions.push({
      name: 'and',
      syntax: '$and(x,y)',
      description: 'Returns true if x and y are true.',
      fn: args => {
        const x = args[0];
        const y = args[1];
        return x && y;
      }
    });
  }

  private orFunction(): void {
    this.functions.push({
      name: 'or',
      syntax: '$or(x,y)',
      description: 'Returns true if x or y is true.',
      fn: args => {
        const x = args[0];
        const y = args[1];
        return x || y;
      }
    });
  }

  private digitsFunction(): void {
    this.functions.push({
      name: 'digits',
      syntax: '$digits(x,y)',
      description: 'Returns x with at least the number of digits specified in y.',
      fn: args => {
        const x = args[0];
        const y = args[1];
        return this.utility.enforceDigits(x, y);
      }
    });
  }

  private intFunction(): void {
    this.functions.push({
      name: 'int',
      syntax: '$int(x)',
      description: 'Parses x to integer.',
      fn: args => {
        const x = args[0];
        return parseInt(x.toString(), 10);
      }
    });
  }
}
