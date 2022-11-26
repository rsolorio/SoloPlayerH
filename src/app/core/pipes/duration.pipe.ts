import { Pipe, PipeTransform } from '@angular/core';
import { UtilityService } from '../services/utility/utility.service';

/**
 * Converts seconds to hour or minute formats.
 * Convert to hours (HH:mm:ss) format: seconds | duration
 * Convert to minutes (mm:ss) format: seconds | duration:'m'
 */
@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  constructor(private utilities: UtilityService) {}

  public transform(value: number, format: string = ''): string {
    if (format === 'm') {
      return this.utilities.secondsToMinutes(value);
    }
    return this.utilities.secondsToHours(value);
  }
}
