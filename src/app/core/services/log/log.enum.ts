export enum LogType {
  Info = 'mdi mdi-alpha-i-box-outline sp-color-info',
  Warning = 'mdi mdi-exclamation-thick sp-color-warning',
  Error = 'mdi mdi-close sp-color-error',
  Debug = 'mdi mdi-bug-outline sp-color-debug'
}

export enum LogLevel {
  /** Logs everything. */
  Verbose,
  /** Logs everything but debug messages. */
  Info,
  /** Logs warning and error messages. */
  Warning,
  /** Logs error messages only. */
  Error
}
