const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const LOG_COLORS = {
  DEBUG: '#7f7f7f',
  INFO: '#0077ff',
  WARN: '#ff9900',
  ERROR: '#ff0000'
};

class Logger {
  constructor() {
    this.level = import.meta.env.VITE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
  }

  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    return {
      prefix,
      message,
      data,
      color: LOG_COLORS[level]
    };
  }

  _log(level, message, data = null) {
    if (LOG_LEVELS[level] >= this.level) {
      const { prefix, message: msg, data: logData, color } = this._formatMessage(level, message, data);
      
      console.groupCollapsed(`%c${prefix} ${msg}`, `color: ${color}`);
      
      if (logData) {
        if (logData instanceof Error) {
          console.error(logData);
          if (logData.response) {
            console.log('Response:', logData.response.data);
            console.log('Status:', logData.response.status);
            console.log('Headers:', logData.response.headers);
          }
        } else {
          console.log(logData);
        }
      }
      
      if (level === 'ERROR') {
        console.trace('Stack trace:');
      }
      
      console.groupEnd();
    }
  }

  debug(message, data) {
    this._log('DEBUG', message, data);
  }

  info(message, data) {
    this._log('INFO', message, data);
  }

  warn(message, data) {
    this._log('WARN', message, data);
  }

  error(message, error) {
    this._log('ERROR', message, error);
  }
}

export const logger = new Logger();