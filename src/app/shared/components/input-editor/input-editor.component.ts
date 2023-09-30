import { Component, OnInit } from '@angular/core';
import { IInputEditorModel } from './input-editor.interface';

@Component({
  selector: 'sp-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.scss']
})
export class InputEditorComponent implements OnInit {
  public model: IInputEditorModel;
  constructor() { }

  ngOnInit(): void {
  }
}
