import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ParserService {

  constructor() { }

  public parse(expression: string, context: any, placeholderMapping?: any): any {
    // 01. Get placeholders from expression
    // 02. Get tokens from placeholders
    // 03. Replace placeholders with tokens in expression
    // 04. Parse functions in expression
  }
}
