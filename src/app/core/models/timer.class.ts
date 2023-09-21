import { Milliseconds } from "../services/utility/utility.enum";
import { UtilityService } from "../services/utility/utility.service";
import { ITimePeriod } from "./core.interface";

export class PeriodTimer {
  private period: ITimePeriod;

  constructor(private utility: UtilityService) {
    this.period = {
      from: new Date(),
      to: null,
      span: null
    };
  }

  public stop(): ITimePeriod {
    this.period.to = new Date();
    this.period.length = this.period.to.getTime() - this.period.from.getTime();
    this.period.span = this.utility.toTimeSpan(
      this.period.length, [Milliseconds.Hour, Milliseconds.Minute, Milliseconds.Second]);
    return this.period;
  }
}