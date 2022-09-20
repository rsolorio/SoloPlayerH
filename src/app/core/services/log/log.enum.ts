export enum LogType {
  Info = 'mdi mdi-alpha-i-box-outline org-color-info',
  Warning = 'mdi mdi-exclamation-thick org-color-warning',
  Error = 'mdi mdi-close org-color-error',
  Debug = 'mdi mdi-bug-outline org-color-debug'
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
