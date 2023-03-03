import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ColorG } from 'src/app/core/models/color-g.class';
import { ITextScrollerModel } from './text-scroller-model.interface';

@Component({
  selector: 'sp-text-scroller',
  templateUrl: './text-scroller.component.html',
  styleUrls: ['./text-scroller.component.scss']
})
export class TextScrollerComponent implements OnInit {

  /**
   * Event fired when the close button is clicked.
   */
  @Output() public close: EventEmitter<void> = new EventEmitter();

  public model: ITextScrollerModel = {
    text: '',
    backgroundColor: ColorG.fromRgba(0, 0, 0),
    textColor: ColorG.fromRgba(255, 255, 255),
    closeHidden: false
  };

  constructor() { }

  @Input() set backgroundColor(val: ColorG) {
    this.model.backgroundColor = val;
  }

  get backgroundColor(): ColorG {
    return this.model.backgroundColor;
  }

  @Input() set textColor(val: ColorG) {
    this.model.textColor = val;
  }

  get textColor(): ColorG {
    return this.model.textColor;
  }

  @Input() set text(val: string) {
    this.model.text = val;
  }

  get text(): string {
    return this.model.text;
  }

  ngOnInit(): void {
  }

  public onClose() {
    this.close.emit();
  }

  public getColorVars(): string {
    return `--fromColor: ${this.model.backgroundColor.toRgbaFormula(0)}; --toColor: ${this.model.backgroundColor.toRgbaFormula(1)};`;
  }

}
