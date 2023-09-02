import { KeyValueGen } from "src/app/core/models/core.interface";

export interface IParseInformation {
  expression: string;
  context: any;
  mappings?: KeyValueGen<string>;
}