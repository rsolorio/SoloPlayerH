import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ITimeDisplayModel } from './time-display.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { Milliseconds } from 'src/app/core/services/utility/utility.enum';

@Component({
  selector: 'sp-time-display',
  templateUrl: './time-display.component.html',
  styleUrls: ['./time-display.component.scss']
})
export class TimeDisplayComponent implements OnInit {
  private model: ITimeDisplayModel = {
    totalSeconds: 0,
    fontColor: '',
    fontClass: '',
    placeholderColor: '',
    placeholderClass: ''
  }
  private timeSpanUnits = [Milliseconds.Hour, Milliseconds.Minute, Milliseconds.Second];
  private timeSpan = this.utility.toTimeSpan(0, this.timeSpanUnits);

  constructor(private utility: UtilityService) { }

  @Output() public click: EventEmitter<Event> = new EventEmitter();

  get totalSeconds(): number {
    return this.model.totalSeconds;
  }

  @Input() set totalSeconds(val: number) {
    this.model.totalSeconds = val;
    this.timeSpan = this.utility.toTimeSpan(this.model.totalSeconds * 1000, this.timeSpanUnits);
  }

  get fontColor(): string {
    return this.model.fontColor;
  }

  @Input() set fontColor(val: string) {
    this.model.fontColor = val;
  }

  get fontClass(): string {
    return this.model.fontClass;
  }

  @Input() set fontClass(val: string) {
    this.model.fontClass = val;
  }

  get placeholderColor(): string {
    return this.model.placeholderColor;
  }

  @Input() set placeholderColor(val: string) {
    this.model.placeholderColor = val;
  }

  get placeholderClass(): string {
    return this.model.placeholderClass;
  }

  @Input() set placeholderClass(val: string) {
    this.model.placeholderClass = val;
  }

  get minutesHidden(): boolean {
    return this.model.minutesHidden;
  }

  @Input() set minutesHidden(val: boolean) {
    this.model.minutesHidden = val;
  }

  get hoursHidden(): boolean {
    return this.model.hoursHidden;
  }

  @Input() set hoursHidden(val: boolean) {
    this.model.hoursHidden = val;
  }

  get blinkEnabled(): boolean {
    return this.model.blinkEnabled;
  }

  @Input() set blinkEnabled(val: boolean) {
    this.model.blinkEnabled = val;
  }

  get seconds(): string {
    return this.utility.enforceDigits(this.timeSpan.seconds, 2);
  }

  get minutes(): string {
    return this.utility.enforceDigits(this.timeSpan.minutes, 2);
  }

  get hours(): string {
    return this.utility.enforceDigits(this.timeSpan.hours, 2);
  }

  ngOnInit(): void {
  }
}
