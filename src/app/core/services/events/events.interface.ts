import { CoreEvent } from './events.enum';

export interface IEvent {
    key: CoreEvent | string;
    data?: any;
}
