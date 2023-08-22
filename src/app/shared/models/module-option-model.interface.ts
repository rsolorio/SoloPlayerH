export interface IModuleOptionModel {
  name: string;
  moduleName: string;
  description?: string;
  valueEditorType?: string;
  multipleValues: boolean;
  valueListTypeId?: string;
  system: boolean;
  values: string;
}