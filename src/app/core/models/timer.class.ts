import { Milliseconds } from "../services/utility/utility.enum";
import { UtilityService } from "../services/utility/utility.service";
import { ITimePeriod } from "./core.interface";

export class PeriodTimer {
  private period: ITimePeriod;

  constructor(private utility: UtilityService) {
    this.period = {
      from: new Date(),
      to: null,
      span: null,
      laps: []
    };
  }

  public stop(data?: any): ITimePeriod {
    this.period.to = new Date();
    this.period.span = this.utility.toTimeSpan(
      this.period.to.getTime() - this.period.from.getTime(),
      [Milliseconds.Hour, Milliseconds.Minute, Milliseconds.Second]);
    this.period.span.data = data;
    return this.period;
  }

  public lap(data?: any): void {
    const lapTime = new Date().getTime();

    let previousTime: number;
    if (this.period.laps.length) {
      previousTime = this.period.laps[this.period.laps.length - 1].total;
    }
    else {
      previousTime = this.period.from.getTime();
    }

    let milliseconds = lapTime;
    milliseconds -= this.period.from.getTime();
    for (const lap of this.period.laps) {
      milliseconds -= lap.total;
    }
    
    const timeSpan = this.utility.toTimeSpan(milliseconds,
      [Milliseconds.Minute, Milliseconds.Second, Milliseconds.Millisecond]);
    timeSpan.data = data;
    this.period.laps.push(timeSpan);
  }
}