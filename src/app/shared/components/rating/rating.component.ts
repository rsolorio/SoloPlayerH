import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { BaseComponent, MakeValueAccessorProvider } from 'src/app/core/models/base-component.class';
import { IEventArgs } from 'src/app/core/models/core.interface';
import { IRatingModel } from './rating.interface';

/**
 * Component that displays a star representing the current rating value.
 * The module of the component using this control needs to import the FormsModule in order to make
 * the value control accessor work.
 */
@Component({
  selector: 'sp-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
  providers: [MakeValueAccessorProvider(RatingComponent)],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingComponent extends BaseComponent<IRatingModel, number> {
  private valueChangeByClick = false;
  public scaleUpAnimationEnabled = false;
  public hoveredValue = 0;
  public clickedValue = 0;

  /** Fired when the value is changed by a click */
  @Output() public change: EventEmitter<IEventArgs<number>> = new EventEmitter();

  get colorOn(): string {
    return this.model.colorOn;
  }

  @Input() set colorOn(val: string) {
    this.model.colorOn = val;
  }

  get colorOff(): string {
    return this.model.colorOff;
  }

  @Input() set colorOff(val: string) {
    this.model.colorOff = val;
  }

  get colorBack(): string {
    return this.model.colorBack;
  }

  @Input() set colorBack(val: string) {
    this.model.colorBack = val;
  }

  get classOn(): string {
    return this.model.classOn;
  }

  @Input() set classOn(val: string) {
    this.model.classOn = val;
  }

  get classOff(): string {
    return this.model.classOff;
  }

  @Input() set classOff(val: string) {
    this.model.classOff = val;
  }

  get classBack(): string {
    return this.model.classBack;
  }

  @Input() set classBack(val: string) {
    this.model.classBack = val;
  }

  constructor(private sanitizer: DomSanitizer, private cd: ChangeDetectorRef) {
    super(cd);
  }

  public getStyleVariables(value: string): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(`--color-on: ${this.model.colorOn};`);
  }

  public calculatePercentage() {
    if (!this.model.value || this.model.value <= 0) {
      this.model.percentage = 0;
      return;
    }

    if (this.model.value >= this.model.max) {
      this.model.percentage = 100;
      return;
    }

    this.model.percentage = (this.model.value / this.model.max) * 100;
  }

  public getPercentageValue(): number {
    return (this.model.percentage / 100) * this.model.max;
  }

  protected buildValueList() {
    this.model.valueList = [];
    for (let valueIndex = 1; valueIndex <= this.model.max; valueIndex++) {
      this.model.valueList.push(valueIndex);
    }
  }

  public onClick(e: Event) {
    // Render the invisible selector
    this.model.showSelector = true;
    // Wait a little bit to render and now activate the animation
    setTimeout(() => {
      this.scaleUpAnimationEnabled = true;
    }, 50);
    // This will prevent other elements to receive the click as well
    e.preventDefault();
    e.stopPropagation();
  }

  public onStarClick(e: Event, val: number) {
    if (this.value !== val) {
      this.valueChangeByClick = true;
      this.value = val;
    }
    this.hideSelector();
    // This will prevent the single start to be clicked as well
    e.preventDefault();
    e.stopPropagation();
  }

  protected onValueChanged() {
    const currentValue = this.getPercentageValue();
    this.calculatePercentage();
    if (this.valueChangeByClick) {
      this.valueChangeByClick = false;
      this.change.emit({
        oldValue: currentValue,
        newValue: this.model.value
      });
    }
  }

  protected initializeModel() {
    this.model = {
      value: 0,
      max: 5,
      percentage: 0,
      showSelector: false,
      valueList: [],
      colorOn: '',
      colorOff: '',
      colorBack: '',
      classOn: '',
      classOff: '',
      classBack: ''
    };
    this.buildValueList();
  }

  protected hideSelector() {
    // Animate
    this.scaleUpAnimationEnabled = false;
    // Allow the animation to finish and then remove the selector element
    setTimeout(() => {
      this.model.showSelector = false;
    }, 300); // This value should match the transition duration of the selector
  }
}
