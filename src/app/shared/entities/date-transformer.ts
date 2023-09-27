import { ValueTransformer } from "typeorm";

export class DateTransformer implements ValueTransformer {

  /** Used to un-marshal data when reading from the database. */
  public from(value: any): Date {
    if (value === undefined || value === null) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    return new Date(value.toString());
  }

  /** Used to marshal data when writing to the database. */
  public to(value: any): any {
    return value;
  }
}

export const dateTransformer = new DateTransformer();