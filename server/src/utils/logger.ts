export type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context && Object.keys(context).length > 0) {
    // Sanitize any sensitive keys if present
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'code', 'privateKey'];
    for (const k of Object.keys(sanitized)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        sanitized[k] = '[REDACTED]';
      }
    }
    payload.context = sanitized;
  }

  return JSON.stringify(payload) + '\n';
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'test') {
      process.stdout.write(formatLog('info', message, context));
    }
  },
  warn(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'test') {
      process.stderr.write(formatLog('warn', message, context));
    }
  },
  error(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'test') {
      process.stderr.write(formatLog('error', message, context));
    }
  },
};
