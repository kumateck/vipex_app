import { describe, expect, test } from 'bun:test';
import { sendMnotifySms } from './mnotify-sms-provider';

const input = {
  config: { apiKey: 'private key', senderId: 'Vipex', apiUrl: 'https://api.mnotify.com/api/' },
  recipient: '0240000000',
  message: 'Your OTP is 123456',
  smsType: 'otp' as const,
};
const fakeFetch = (payload: unknown, status = 200) =>
  (async () => Response.json(payload, { status })) as unknown as typeof fetch;

describe('BMS mNotify OTP transport', () => {
  test('uses the official request shape, encoded key and bounded timeout', async () => {
    let calls = 0;
    const request = (async (url: string | URL | Request, options?: RequestInit) => {
      calls++;
      expect(String(url)).toBe('https://api.mnotify.com/api/sms/quick?key=private+key');
      expect(options?.method).toBe('POST');
      expect(new Headers(options?.headers).get('accept')).toBe('application/json');
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      expect(JSON.parse(String(options?.body))).toMatchObject({
        recipient: ['0240000000'],
        sender: 'Vipex',
        sms_type: 'otp',
        is_schedule: false,
      });
      return Response.json({
        status: 'success',
        code: '2000',
        summary: { _id: 'campaign', total_sent: 1 },
      });
    }) as unknown as typeof fetch;
    expect(await sendMnotifySms(input, request)).toEqual({
      status: 'sent',
      providerMessageId: 'campaign',
    });
    expect(calls).toBe(1);
  });
  test.each([
    'https://api.mnotify.com/api',
    'https://api.mnotify.com/api/',
    'https://api.mnotify.com/api/sms/quick',
    'https://api.mnotify.com',
  ])('normalizes API URL %s without doubling the endpoint', async (apiUrl) => {
    await sendMnotifySms({ ...input, config: { ...input.config, apiUrl } }, (async (
      url: unknown,
    ) => {
      expect(new URL(String(url)).pathname).toBe('/api/sms/quick');
      return Response.json({ code: '2000' });
    }) as unknown as typeof fetch);
  });
  test('accepts a numeric success code when returned by BMS', async () => {
    expect((await sendMnotifySms(input, fakeFetch({ status: 'success', code: 2000 }))).status).toBe(
      'sent',
    );
  });
  test.each([
    { code: '1000', message: 'Insufficient main wallet balance' },
    { status: 'error', code: '2000', message: 'Rejected' },
    { status: 'success' },
    null,
    { code: '2000', summary: { total_sent: 0, total_rejected: 1 } },
  ])('rejects provider failure or invalid success acknowledgements: %j', async (payload) => {
    expect((await sendMnotifySms(input, fakeFetch(payload))).status).toBe('failed');
  });
  test('includes provider rejection details in diagnostics', async () => {
    expect(
      await sendMnotifySms(
        input,
        fakeFetch({ code: '1000', message: 'Insufficient main wallet balance' }),
      ),
    ).toMatchObject({
      status: 'failed',
      errorMessage: 'mNotify rejected the message (code 1000): Insufficient main wallet balance',
    });
  });
  test('HTTP failures and invalid JSON never count as sent', async () => {
    expect((await sendMnotifySms(input, fakeFetch({ message: 'denied' }, 403))).status).toBe(
      'failed',
    );
    expect(
      await sendMnotifySms(
        input,
        (async () => new Response('not JSON', { status: 200 })) as unknown as typeof fetch,
      ),
    ).toMatchObject({
      status: 'failed',
      errorMessage: 'mNotify returned an invalid JSON acknowledgement',
    });
  });
  test.each([500, 502, 503])(
    'handles an HTML HTTP %s error without exposing HTML or resending',
    async (status) => {
      let calls = 0;
      const result = await sendMnotifySms({ ...input, smsType: undefined }, (async (
        _url: unknown,
        options?: RequestInit,
      ) => {
        calls++;
        expect(JSON.parse(String(options?.body))).not.toHaveProperty('sms_type');
        return new Response('<!DOCTYPE html><html><script>window.NREUM={}</script></html>', {
          status,
          headers: { 'content-type': 'text/html' },
        });
      }) as unknown as typeof fetch);
      expect(result).toEqual({
        status: 'failed',
        errorMessage: `mNotify service error (HTTP ${status}). Delivery acceptance could not be confirmed. Check mNotify delivery reports before retrying.`,
      });
      expect(calls).toBe(1);
    },
  );
  test('keeps JSON rejection details and redacts credentials on HTTP errors', async () => {
    expect(await sendMnotifySms(input, fakeFetch({ message: 'Invalid private key' }, 403))).toEqual(
      {
        status: 'failed',
        errorMessage: 'mNotify API returned 403: Invalid [REDACTED]',
      },
    );
    const result = await sendMnotifySms(
      input,
      (async () =>
        new Response('<html>Access denied</html>', { status: 403 })) as unknown as typeof fetch,
    );
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('No JSON error details returned');
    expect(result.errorMessage).not.toContain('<html>');
  });
  test('timeouts fail once without silently retrying a billable SMS', async () => {
    let calls = 0;
    const result = await sendMnotifySms(input, (async () => {
      calls++;
      throw new DOMException('timeout', 'TimeoutError');
    }) as unknown as typeof fetch);
    expect(result).toMatchObject({
      status: 'failed',
      errorMessage: 'mNotify request timed out; delivery acceptance could not be confirmed',
    });
    expect(calls).toBe(1);
  });
  test('redacts configured API keys in both response and transport failures', async () => {
    const rejected = await sendMnotifySms(
      input,
      fakeFetch({ code: '1000', message: 'key=private key is invalid' }),
    );
    const failed = await sendMnotifySms(input, (async () => {
      throw new Error('request failed with private key');
    }) as unknown as typeof fetch);
    expect(rejected.errorMessage).not.toContain('private key');
    expect(failed.errorMessage).not.toContain('private key');
  });
  test('oversize sender IDs reject before any provider request', async () => {
    let called = false;
    const result = await sendMnotifySms(
      { ...input, config: { ...input.config, senderId: 'x'.repeat(12) } },
      (async () => {
        called = true;
        return Response.json({ code: '2000' });
      }) as unknown as typeof fetch,
    );
    expect(result.status).toBe('failed');
    expect(called).toBe(false);
  });
});
