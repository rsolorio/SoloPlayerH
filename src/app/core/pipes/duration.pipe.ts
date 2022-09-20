import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  public transform(value: number): string {
    const minutes = Math.floor(value / 60);
    const minutesText = minutes.toString().padStart(2, '0');

    const seconds = value - minutes * 60;
    const secondsText = seconds.toString().padStart(2, '0');

    return `${minutesText}:${secondsText}`;
  }
}
