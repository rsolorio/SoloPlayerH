export interface IFunctionDefinition {
  name: string;
  syntax: string;
  description?: string;
  fn: (args: any[]) => any;
}

export interface IFunctionResult {
  value: any;
  name: string;
  uniqueName: string;
}