import { describe, expect, test } from 'bun:test';
import {
  appendSmsVariable,
  extractSmsTemplateVariables,
  getUnsupportedBulkSmsVariables,
  normalizeSmsTemplateVariables,
} from '@/features/platform-configuration/sms-settings/utils/sms-template-variables';

describe('SMS template variables', () => {
  test('extracts unique variables in message order', () => {
    expect(
      extractSmsTemplateVariables(
        'Hello {{recipientName}}, today is {{date}}. Welcome {{recipientName}}.',
      ),
    ).toEqual(['recipientName', 'date']);
  });

  test('appends a variable with readable spacing', () => {
    expect(appendSmsVariable('Hello', 'recipientName')).toBe('Hello {{recipientName}}');
    expect(appendSmsVariable('Hello ', 'date')).toBe('Hello {{date}}');
  });

  test('normalizes stored variables defensively', () => {
    expect(normalizeSmsTemplateVariables(['recipientName', 42, null])).toEqual(['recipientName']);
    expect(normalizeSmsTemplateVariables(null)).toEqual([]);
  });

  test('rejects variables the bulk dispatcher cannot resolve', () => {
    expect(
      getUnsupportedBulkSmsVariables(
        '{{senderName}} ({{senderPhone}}) to {{recipientName}} ({{recipientPhone}}) at {{branch}} / {{location}} on {{date}}',
      ),
    ).toEqual([]);
    expect(getUnsupportedBulkSmsVariables('{{companyId}}')).toEqual(['companyId']);
  });
});
