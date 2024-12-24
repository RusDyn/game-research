import winston from 'winston'
import { testConfig } from '../config/test'

// Custom format for test logs
const testFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    })
  })
)

// Create test logger instance
const testLogger = winston.createLogger({
  level: testConfig.logging.level,
  format: testFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  // Don't exit on error
  exitOnError: false
})

// Helper functions for different log levels
export const logTestInfo = (message: string, meta?: Record<string, any>) => {
  testLogger.info(message, meta)
}

export const logTestError = (message: string, error?: Error | unknown) => {
  if (error instanceof Error) {
    testLogger.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    })
  } else {
    testLogger.error(message, { error })
  }
}

export const logTestDebug = (message: string, meta?: Record<string, any>) => {
  testLogger.debug(message, meta)
}

export const logTestWarning = (message: string, meta?: Record<string, any>) => {
  testLogger.warn(message, meta)
}

// Test helper to capture logs
export class TestLogCapture {
  private logs: any[] = []

  start() {
    this.logs = []
    testLogger.add(
      new winston.transports.Console({
        format: winston.format.printf((info) => {
          this.logs.push(info)
          return ''
        })
      })
    )
  }

  stop() {
    testLogger.clear()
    testLogger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    )
  }

  getLogs() {
    return this.logs
  }

  clear() {
    this.logs = []
  }

  containsMessage(message: string): boolean {
    return this.logs.some(log => log.message.includes(message))
  }

  containsError(errorMessage: string): boolean {
    return this.logs.some(log => 
      log.level === 'error' && 
      (log.message.includes(errorMessage) || 
       (log.error && log.error.message && log.error.message.includes(errorMessage)))
    )
  }
}

// Export logger instance for direct use
export const logger = testLogger
