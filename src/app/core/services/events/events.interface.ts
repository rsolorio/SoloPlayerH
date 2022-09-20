import { EventType } from './events.enum';

export interface IEvent {
    key: EventType | string;
    data?: any;
}
