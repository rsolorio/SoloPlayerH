import { LogType } from './log.enum';

export interface ILogEntry {
    message: string;
    type: LogType;
    dateTime: Date;
    data?: string;
}

export interface ILogTabularData {
    /** Array of data or object. */
    tabular: any;
    /** If an array of data is specified, you can choose the columns to display from each item. */
    columns?: string[];
}