import { ISize } from 'src/app/core/models/core.interface';
import { BreakpointMode } from './utility.enum';

export interface IWindowSize {
    size: ISize;
    mode: BreakpointMode;
}

export interface IWindowSizeChangedEvent {
    old: IWindowSize;
    new: IWindowSize;
}

export interface ITimeSpan {
    milliseconds?: number;
    seconds?: number;
    minutes?: number;
    hours?: number;
    days?: number;
}
