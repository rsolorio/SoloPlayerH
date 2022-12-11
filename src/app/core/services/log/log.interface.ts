import { LogType } from './log.enum';

export interface ILogEntry {
    message: string;
    type: LogType;
    dateTime: Date;
    data?: string;
}
