export const BULK_SMS_VARIABLES = ['recipientName', 'companyId', 'date'] as const;
const BULK_SMS_VARIABLE_SET = new Set<string>(BULK_SMS_VARIABLES);

const VARIABLE_PATTERN = /{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g;

export function extractSmsTemplateVariables(body: string) {
  return [...new Set([...body.matchAll(VARIABLE_PATTERN)].flatMap((match) => match[1] ?? []))];
}

export function normalizeSmsTemplateVariables(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((variable): variable is string => typeof variable === 'string');
}

export function appendSmsVariable(body: string, variable: string) {
  return `${body}${body && !body.endsWith(' ') ? ' ' : ''}{{${variable}}}`;
}

export function getUnsupportedBulkSmsVariables(body: string) {
  return extractSmsTemplateVariables(body).filter(
    (variable) => !BULK_SMS_VARIABLE_SET.has(variable),
  );
}
