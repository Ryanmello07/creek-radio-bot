import { logEvent } from './supabase';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function timestamp(): string {
  return new Date().toISOString();
}

function format(level: LogLevel, context: string, message: string): string {
  return `[${timestamp()}] [${level.toUpperCase()}] [${context}] ${message}`;
}

export const logger = {
  info(context: string, message: string): void {
    console.log(format('info', context, message));
  },

  warn(context: string, message: string): void {
    console.warn(format('warn', context, message));
  },

  error(context: string, message: string, err?: unknown): void {
    const detail = err instanceof Error ? ` — ${err.message}` : '';
    console.error(format('error', context, `${message}${detail}`));
  },

  debug(context: string, message: string): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.debug(format('debug', context, message));
    }
  },

  async event(
    guildId: string,
    eventType: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    console.log(format('info', `guild:${guildId}`, `[${eventType}] ${message}`));
    await logEvent(guildId, eventType, message, metadata);
  },
};
