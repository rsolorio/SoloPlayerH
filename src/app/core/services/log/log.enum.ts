export enum LogType {
  Info = 'mdi-alpha-i-box-outline sp-color-info mdi',
  Warning = 'mdi-exclamation-thick sp-color-warning mdi',
  Error = 'mdi-close sp-color-error mdi',
  Debug = 'mdi-bug-outline sp-color-debug mdi'
}

export enum LogLevel {
  /** Logs everything including debug data. */
  Verbose,
  /** Logs everything but debug messages. */
  Info,
  /** Logs warning and error messages. */
  Warning,
  /** Logs error messages only. */
  Error
}
