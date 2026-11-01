import { getErrorCode } from './customer-credit.service';

export function serializeErrorChain(error: unknown, depth = 0): Array<Record<string, unknown>> {
  if (!error || typeof error !== 'object' || depth > 8) return [];
  const err = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    command?: unknown;
    detail?: unknown;
    hint?: unknown;
    schema?: unknown;
    table?: unknown;
    column?: unknown;
    constraint?: unknown;
    cause?: unknown;
  };

  const node: Record<string, unknown> = {
    depth,
    name: err.name,
    message: err.message,
    code: err.code,
    command: err.command,
    detail: err.detail,
    hint: err.hint,
    schema: err.schema,
    table: err.table,
    column: err.column,
    constraint: err.constraint,
  };

  return [node, ...serializeErrorChain(err.cause, depth + 1)];
}

export function debugCustomerServiceError(
  scope: string,
  input: Record<string, unknown>,
  error: unknown,
): void {
  console.error(
    '[customers][debug]',
    JSON.stringify(
      {
        scope,
        input,
        errorCode: getErrorCode(error),
        errorChain: serializeErrorChain(error),
      },
      null,
      2,
    ),
  );
}
