export interface IEntityEditorModel {
  data: any;
  groups: IEntityGroupModel[];
}

export interface IEntityFieldModel {
  propertyName: string;
  icon: string;
  label: string;
  labelVisible?: boolean;
  onEdit?: (field: IEntityFieldModel) => void;
}

export interface IEntityGroupModel {
  fields: IEntityFieldModel[];
}