/**
 * Logger utility for development and production
 * - In development: logs to console
 * - In production: only logs errors (can be extended to send to error tracking service)
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log informational messages (development only)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (always logged, can be sent to error tracking in production)
   */
  error: (...args) => {
    console.error(...args);
    // In production, you can send to error tracking service here
    // Example: if (window.Sentry) window.Sentry.captureException(args[0]);
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log info messages (development only)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

export default logger;
