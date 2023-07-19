import { Injectable } from '@angular/core';
import { ILogEntry } from './log.interface';
import { LogLevel, LogType } from './log.enum';
import { ColorCode } from '../../models/core.enum';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  private entries: ILogEntry[] = [];
  private maxEntries: 1000;
  public level = LogLevel.Info;
  /**
   * This value specifies when the excess of the list should be trim.
   * Setting to 0 will remove excess every time one single item exceeds.
   * The greater the value the more it waits to trim the excess.
   */
  private maxEntriesExcess = 50;

  /*tslint:disable:no-console */
  constructor() { }

  // Public Methods *******************************************************************************
  public clear(): void {
    this.entries = [];
  }

  /** Gets a reference to the list of all logs. */
  public get(): ILogEntry[] {
    return this.entries;
  }

  /**
   * Records a debug message with tabular data.
   * @param message The debug message.
   * @param data Array or object to display as table.
   * @param columns An array of column names to display.
   */
  public table(message: string, data: any, columns?: string[]): void {
    this.debug(message, { tabularData: data, columns: columns }, false);
  }

  /**
   * Records a debug message.
   */
  public debug(message: string, data?: any, trace?: boolean): void {
    // Debug is only allowed with verbose log
    if (this.level === LogLevel.Verbose) {
      this.log(message, LogType.Debug, data, trace);
    }
  }

  /** Records an info message. */
  public info(message: string, data?: any, trace?: boolean): void {
    if (this.level === LogLevel.Error || this.level === LogLevel.Warning) {
      return;
    }
    this.log(message, LogType.Info, data, trace);
  }

  /**
   * Records a warning message.
   */
  public warn(message: string, data?: any, trace?: boolean): void {
    if (this.level === LogLevel.Error) {
      return;
    }
    this.log(message, LogType.Warning, data, trace);
  }

  /**
   * Records an error message.
   */
  public error(message: string, data?: any, trace?: boolean): void {
    this.log(message, LogType.Error, data, trace);
  }

  // Private Methods ******************************************************************************
  private log(message: string, type: LogType, data?: any, trace?: boolean): void {
    const entry: ILogEntry = {
      message,
      type,
      dateTime: new Date()
    };

    let color = '';
    switch (type) {
      case LogType.Debug:
        color = ColorCode.Orange;
        break;
      case LogType.Info:
        color = ColorCode.Blue;
        break;
      case LogType.Warning:
        color = ColorCode.Yellow;
        break;
      case LogType.Error:
        color = ColorCode.Red;
        break;
    }
    console.log('%c%s', `color: ${color}`, message);

    if (data) {
      if (data.tabularData) {
        console.table(data.tabularData, data.columns);
      }
      else {
        console.log(data);
      }
      // Adding 4 spaces indent
      entry.data = JSON.stringify(data, null, 4);
    }
    if (trace) {
      console.trace();
    }

    this.entries.unshift(entry);

    // Trim messages only when it is over than the excess
    if (this.entries.length > this.maxEntries + this.maxEntriesExcess) {
      const excess = this.entries.length - this.maxEntries;
      // Remove excess
      const startIndex = this.maxEntries;
      this.entries.splice(startIndex, excess);
    }
  }
}
