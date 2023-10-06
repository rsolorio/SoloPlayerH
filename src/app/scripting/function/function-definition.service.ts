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
    this.noBracketsFunction();
    this.pathFunction();
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

  private noBracketsFunction(): void {
    this.functions.push({
      name: 'noBrackets',
      syntax: '$noBrackets(x)',
      description: 'Removes any content in x surrounded by brackets, including the brackets.',
      fn: args => {
        let x = args[0] as string;
        const regexp = new RegExp('\\[(.*?)\\]', 'g');
        const matches = x.match(regexp);
        if (matches?.length) {
          for (const match of matches) {
            x = x.replace(match, '').trim();
          }
        }
        return x;
      }
    });
  }

  private pathFunction(): void {
    this.functions.push({
      name: 'path',
      syntax: '$path(args)',
      description: 'Combines all the arguments to create a path by automatically adding the proper path separator.',
      fn: args => {
        const driveSeparator = ':';
        const pathSeparator = '\\';
        const newArgs: string[] = [];
        // Treat the first item differently
        const firstItem = args.shift();
        if (firstItem) {
          const firstText = firstItem.toString() as string;
          // Does it contain the drive info?
          if (firstText.length > 2 && firstText[1] === driveSeparator && firstItem[2] === pathSeparator) {
            if (firstText.endsWith(pathSeparator)) {
              // Remove the last separator since it will be automatically added at the end
              newArgs.push(firstText.slice(0, -1));
            }
            else {
              newArgs.push(firstText);
            }
          }
          else {
            newArgs.push(this.utility.removeReservedFileCharacters(firstText));
          }
        }
        // For the rest of the items remove any text that could cause problem with file naming convention
        args.forEach(arg => {
          if (arg) {
            newArgs.push(this.utility.removeReservedFileCharacters(arg.toString()));
          }
        });
        return newArgs.join(pathSeparator);
      }
    });
  }
}
