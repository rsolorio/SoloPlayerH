export interface IEntityEditorModel {
  data: any;
  fields: IEntityFieldModel[];
}

export interface IEntityFieldModel {
  propertyName: string;
  icon: string;
  onEdit?: (field: IEntityFieldModel) => void;
}