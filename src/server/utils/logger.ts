import pino, { type Level } from 'pino';
import { env } from './env';

type LogArgs = unknown[];

type LogInput = {
  msg: string;
  data?: Record<string, unknown>;
};

const transport = env.LOG_PRETTY
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    })
  : undefined;

const base = pino(
  {
    level: env.LOG_LEVEL,
    base: {
      service: 'vipex-api',
      environment: env.APP_ENV,
    },
  },
  transport,
);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const toErrorPayload = (value: unknown): Record<string, unknown> => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: value.cause,
    };
  }

  return { value };
};

const normalizeArgs = (args: LogArgs): LogInput => {
  if (args.length === 0) return { msg: '' };

  const [first, second, ...rest] = args;

  if (typeof first === 'string') {
    const data: Record<string, unknown> = {};

    if (second instanceof Error) data.err = toErrorPayload(second);
    else if (isPlainObject(second)) Object.assign(data, second);
    else if (typeof second !== 'undefined') data.arg1 = second;

    if (rest.length > 0) {
      data.extra = rest.map((item) => (item instanceof Error ? toErrorPayload(item) : item));
    }

    return {
      msg: first,
      data: Object.keys(data).length > 0 ? data : undefined,
    };
  }

  if (first instanceof Error) {
    return {
      msg: first.message,
      data: {
        err: toErrorPayload(first),
      },
    };
  }

  if (isPlainObject(first)) {
    return {
      msg: typeof second === 'string' ? second : '',
      data: first,
    };
  }

  return {
    msg: String(first),
    data:
      args.length > 1
        ? {
            extra: args
              .slice(1)
              .map((item) => (item instanceof Error ? toErrorPayload(item) : item)),
          }
        : undefined,
  };
};

function write(method: Level, args: LogArgs) {
  const { msg, data } = normalizeArgs(args);

  if (data) {
    base[method](data, msg);
    return;
  }

  base[method](msg);
}

export const logger = {
  debug: (...args: LogArgs) => write('debug', args),
  info: (...args: LogArgs) => write('info', args),
  warn: (...args: LogArgs) => write('warn', args),
  error: (...args: LogArgs) => write('error', args),
};
