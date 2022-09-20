import { Pipe, PipeTransform } from '@angular/core';
import { orderBy } from 'lodash';

/**
 * Pipe that sorts an array.
 * Usage:
 * *ngFor="let item of simpleArray | sortBy:'':'asc'"
 * *ngFor="let item of arrayOfObjects | sortBy:'propertyName'"
 * *ngFor="let item of arrayOfObjects | sortBy:'propertyName':'desc'"
 */
@Pipe({
  name: 'sortBy'
})
export class SortByPipe implements PipeTransform {

  public transform(values: any[], property: string = '', order: '' | 'asc' | 'desc' = ''): any[] {
    if (!values || values.length <= 1) {
      return values;
    }

    if (!property) {
      const result = values.sort();
      if (order && order === 'desc') {
        return result.reverse();
      }
      return result;
    }

    return orderBy(values, [property], [order === 'desc' ? 'desc' : 'asc']);
  }
}
