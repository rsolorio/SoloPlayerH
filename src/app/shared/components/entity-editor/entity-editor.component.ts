import { Component, Input, OnInit } from '@angular/core';
import { IEntityEditorModel } from './entity-editor.interface';

@Component({
  selector: 'sp-entity-editor',
  templateUrl: './entity-editor.component.html',
  styleUrls: ['./entity-editor.component.scss']
})
export class EntityEditorComponent implements OnInit {
  constructor() { }

  @Input() public model: IEntityEditorModel = {
    data: null,
    fields: []
  };

  ngOnInit(): void {
  }

}
