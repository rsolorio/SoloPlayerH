import { ValueEditorType } from "src/app/core/models/core.enum";

export interface IEntityEditorModel {
  data: any;
  groups: IEntityGroupModel[];
}

export interface IEntityFieldModel {
  propertyName: string;
  icon: string;
  label: string;
  labelVisible?: boolean;
  badge?: string;
  editorType?: ValueEditorType;
  onEdit?: (field: IEntityFieldModel) => void;
}

export interface IEntityGroupModel {
  fields: IEntityFieldModel[];
}