import { Pipe, PipeTransform } from '@angular/core';
import { UtilityService } from '../services/utility/utility.service';

/**
 * Pipe that formats a date as a readable value.
 * Usage:
 * Format date and time: dateValue | readableDateTime
 * Format only date: dateValue | readableDateTime:true
 * Format only date with date separator: dateValue | readableDateTime:true,'-'
 */
@Pipe({
  name: 'readableDateTime'
})
export class ReadableDateTimePipe implements PipeTransform {

  constructor(private utilities: UtilityService) {}

  transform(value: Date, ignoreTime: boolean = false, dateSeparator: string = '/'): string {
    if (ignoreTime) {
      return this.utilities.toReadableDate(value, dateSeparator);
    }
    return this.utilities.toReadableDateAndTime(value, dateSeparator);
  }
}
