import { LogType } from './log.enum';

export interface ILogEntry {
    message: string;
    type: LogType;
    dateTime: string;
    data?: string;
}
