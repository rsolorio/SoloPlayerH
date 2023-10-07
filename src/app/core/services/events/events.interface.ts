import { CoreEvent } from "src/app/app-events";

export interface IEvent {
    key: CoreEvent | string;
    data?: any;
}
