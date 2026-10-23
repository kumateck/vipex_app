import { describe, expect, test } from 'bun:test';
import { buildCampaignTemplateValues } from './campaign-template-values';
import { renderTemplate } from './utils';

describe('SMS location template values', () => {
  test('renders name, telephone and the existing location alias without losing leading zeroes', () => {
    const values = buildCampaignTemplateValues({
      location: 'Adum collection desk',
      locationPhone: '0300000012',
    });
    expect(renderTemplate('{{locationName}}: {{locationPhone}} / {{location}}', values)).toBe(
      'Adum collection desk: 0300000012 / Adum collection desk',
    );
  });
  test('renders missing name and telephone as empty strings', () => {
    const values = buildCampaignTemplateValues({ location: null, locationPhone: null });
    expect(values).toMatchObject({ location: '', locationName: '', locationPhone: '' });
    expect(renderTemplate('[{{locationName}}] [{{locationPhone}}]', values)).toBe('[] []');
  });
});
