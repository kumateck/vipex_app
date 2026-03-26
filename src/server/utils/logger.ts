import { isDev } from './env';

type LogArgs = unknown[];

function write(method: 'debug' | 'info' | 'warn' | 'error', args: LogArgs) {
  if (!isDev) return;

  console[method](...args);
}

export const logger = {
  debug: (...args: LogArgs) => write('debug', args),
  info: (...args: LogArgs) => write('info', args),
  warn: (...args: LogArgs) => write('warn', args),
  error: (...args: LogArgs) => write('error', args),
};
