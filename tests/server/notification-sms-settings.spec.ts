import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '@/server/utils/http-status';
import { PermissionKeys, RoutePermissionOverrides } from '@/shared/permissions/constants';
import {
  SMS_EVENT_DEFINITIONS,
  getParcelStatusSmsEventCode,
} from '@/server/features/notification-hub/sms-event-definitions';
import { updateCompanySmsEventSvc } from '@/server/features/notification-hub/sms-settings.service';
import { http } from '../utils/request';

describe('Company SMS settings', () => {
  test('SMS configuration is protected as platform configuration', () => {
    expect(RoutePermissionOverrides['/settings/sms']).toBe(PermissionKeys.CanReadCompanyProfile);
  });

  test('every default message only uses variables declared by its event', () => {
    for (const definition of SMS_EVENT_DEFINITIONS) {
      const allowedVariables = new Set<string>(definition.variables);
      const usedVariables = [...definition.defaultBody.matchAll(/{{(\w+)}}/g)].flatMap((match) =>
        match[1] ? [match[1]] : [],
      );
      expect(usedVariables.length).toBeGreaterThan(0);
      expect(usedVariables.every((variable) => allowedVariables.has(variable))).toBeTrue();
    }
  });

  test('maps every parcel call outcome to a defined SMS action', () => {
    expect(getParcelStatusSmsEventCode('pickup')).toBe('parcel_status_call_pickup');
    expect(getParcelStatusSmsEventCode('delivery')).toBe('parcel_status_call_delivery');
    expect(getParcelStatusSmsEventCode('follow_up')).toBe('parcel_status_call_follow_up');
    expect(getParcelStatusSmsEventCode('contacted')).toBe('parcel_status_call_contacted');
  });

  test('rejects undeclared template variables before persistence', async () => {
    await expect(
      updateCompanySmsEventSvc({
        companyId: 'company_test',
        actorUserId: 'user_test',
        eventCode: 'receiver_pickup_otp',
        body: 'Use {{unknownOtpVariable}} to collect your parcel.',
      }),
    ).rejects.toThrow('Unknown SMS variables: unknownOtpVariable');
  });

  test('SMS settings routes are mounted', async () => {
    const settings = await http('GET', '/v1/notification-hub/sms-settings');
    const provider = await http('PUT', '/v1/notification-hub/sms-settings/default-provider', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ providerKey: 'mnotify' }),
    });
    const event = await http(
      'PUT',
      '/v1/notification-hub/sms-settings/events/receiver_pickup_otp',
      {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'Your code is {{otp}}.' }),
      },
    );
    const templates = await http('GET', '/v1/notification-hub/sms-settings/templates');
    const bulkCampaign = await http('POST', '/v1/notification-hub/sms-settings/bulk-campaigns', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Test campaign',
        body: 'Hello',
        audienceType: 'customers_all',
      }),
    });

    for (const status of [
      settings.status,
      provider.status,
      event.status,
      templates.status,
      bulkCampaign.status,
    ]) {
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(status);
    }
  });
});
