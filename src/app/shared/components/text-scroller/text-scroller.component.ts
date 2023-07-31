import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ColorG } from 'src/app/core/models/color-g.class';
import { ITextScrollerModel } from './text-scroller-model.interface';
import { IBasicColorPalette } from '../../services/color-utility/color-utility.interface';

@Component({
  selector: 'sp-text-scroller',
  templateUrl: './text-scroller.component.html',
  styleUrls: ['./text-scroller.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextScrollerComponent implements OnInit {

  /**
   * Event fired when the close button is clicked.
   */
  @Output() public close: EventEmitter<void> = new EventEmitter();

  public model: ITextScrollerModel = {
    text: '',
    closeHidden: false,
    palette: {
      background: ColorG.black,
      primary: ColorG.white,
      secondary: ColorG.gray,
      dominant: ColorG.black
    }
  };

  constructor() { }

  @Input() set palette(val: IBasicColorPalette) {
    this.model.palette = val;
  }

  get palette(): IBasicColorPalette {
    return this.model.palette;
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
    return `--fromColor: ${this.model.palette.background.toRgbaFormula(0)}; --toColor: ${this.model.palette.background.toRgbaFormula(1)};`;
  }

  public toggleTextSize(): void {
    this.model.bigTextEnabled = !this.model.bigTextEnabled;
  }

}
