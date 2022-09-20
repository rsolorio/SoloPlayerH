import { INumberRange } from 'src/app/core/models/core.interface';

export class BreakpointRanges {
    public static small: INumberRange = {
        from: 0,
        to: 767
    };

    public static large: INumberRange = {
        from: 768,
        to: 9999
    };
}
