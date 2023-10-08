export interface ITimeDisplayModel {
  totalSeconds: number;
  fontColor: string;
  fontClass: string;
  placeholderColor: string;
  placeholderClass: string;
  hoursHidden?: boolean;
  minutesHidden?: boolean;
  blinkEnabled?: boolean;
}