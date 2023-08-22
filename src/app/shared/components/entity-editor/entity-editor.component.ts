import { Component, Input, OnInit } from '@angular/core';
import { IEntityEditorModel, IEntityFieldModel } from './entity-editor.interface';
import { ValueEditorType } from 'src/app/core/models/core.enum';

@Component({
  selector: 'sp-entity-editor',
  templateUrl: './entity-editor.component.html',
  styleUrls: ['./entity-editor.component.scss']
})
export class EntityEditorComponent implements OnInit {
  public ValueEditorType = ValueEditorType;
  constructor() { }

  @Input() public model: IEntityEditorModel = {
    data: null,
    groups: []
  };

  ngOnInit(): void {
  }

  public onPrependClick(field: IEntityFieldModel): void {
    field.labelVisible = !field.labelVisible;
  }

  public getYesNoValue(field: IEntityFieldModel): string {
    const data = this.model.data[field.propertyName];
    if (data) {
      return 'Yes';
    }
    return 'No';
  }

}
