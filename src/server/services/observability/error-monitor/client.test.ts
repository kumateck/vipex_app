import { afterEach, describe, expect, test } from 'bun:test';
import { gunzipSync } from 'node:zlib';
import { ErrorMonitor, MAX_EVENTS_PER_BATCH, type ErrorMonitorOptions } from './client';
import { buildErrorEvent, type MonitorEvent } from './event';

type Call = {
  url: string;
  headers: Headers;
  body: { events?: MonitorEvent[]; [k: string]: unknown };
};

function fakeFetch(respond: (call: Call, index: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const raw = gunzipSync(init!.body as Uint8Array).toString('utf8');
    const call = { url: String(input), headers: new Headers(init!.headers), body: JSON.parse(raw) };
    calls.push(call);
    return respond(call, calls.length - 1);
  }) as typeof fetch;
  return { impl, calls };
}

const monitors: ErrorMonitor[] = [];
function createMonitor(fetchImpl: typeof fetch, overrides: Partial<ErrorMonitorOptions> = {}) {
  const monitor = new ErrorMonitor({
    url: 'https://monitor.test/',
    apiKey: ' key-123 ',
    instance: 'vipex-test',
    release: 'abc123',
    machineName: 'box-1',
    flushDelayMs: 60_000,
    minBackoffMs: 10,
    maxBackoffMs: 50,
    fetch: fetchImpl,
    log: () => undefined,
    ...overrides,
  });
  monitors.push(monitor);
  return monitor;
}

const events = (count: number) =>
  Array.from({ length: count }, (_, i) => buildErrorEvent(new Error(`e${i}`)));

afterEach(() => {
  monitors.splice(0).forEach((m) => m.stop());
});

describe('ErrorMonitor batching', () => {
  test('sends gzipped batches of at most 500 events with the API key', async () => {
    const { impl, calls } = fakeFetch(() => new Response(null, { status: 200 }));
    const monitor = createMonitor(impl);
    events(1_201).forEach((e) => monitor.capture(e));

    await monitor.flush();

    expect(calls.map((c) => c.body.events!.length)).toEqual([MAX_EVENTS_PER_BATCH, 500, 201]);
    expect(calls[0]!.url).toBe('https://monitor.test/ingest/v1/errors');
    expect(calls[0]!.headers.get('X-Api-Key')).toBe('key-123');
    expect(calls[0]!.headers.get('Content-Encoding')).toBe('gzip');
    expect(calls[0]!.body).toMatchObject({
      instance: 'vipex-test',
      release: 'abc123',
      machineName: 'box-1',
    });
    expect(calls[0]!.body.events![0]).toMatchObject({ instance: 'vipex-test', release: 'abc123' });
    expect(monitor.pending).toBe(0);
  });

  test('splits batches over 5 MB before sending', async () => {
    const { impl, calls } = fakeFetch(() => new Response(null, { status: 200 }));
    const monitor = createMonitor(impl);
    // ~30 KB each, 300 events ≈ 9 MB of JSON.
    for (const event of events(300))
      monitor.capture({ ...event, exceptionDetails: 'x'.repeat(30_000) });

    await monitor.flush();

    expect(calls.length).toBeGreaterThan(1);
    expect(calls.reduce((n, c) => n + c.body.events!.length, 0)).toBe(300);
    for (const call of calls)
      expect(JSON.stringify(call.body).length).toBeLessThanOrEqual(5 * 1024 * 1024);
  });

  test('halves a rejected batch and drops only the event that can never be accepted', async () => {
    const bad = buildErrorEvent(new Error('bad'));
    const { impl, calls } = fakeFetch(
      (call) =>
        new Response(null, { status: call.body.events!.some((e) => e.id === bad.id) ? 400 : 200 }),
    );
    const monitor = createMonitor(impl);
    const good = events(3);
    [good[0]!, bad, good[1]!, good[2]!].forEach((e) => monitor.capture(e));

    await monitor.flush();

    const accepted = calls.filter((c) => !c.body.events!.some((e) => e.id === bad.id));
    expect(accepted.flatMap((c) => c.body.events!.map((e) => e.id)).sort()).toEqual(
      good.map((e) => e.id).sort(),
    );
    expect(monitor.pending).toBe(0);
  });

  test('caps the queue by dropping the oldest events', async () => {
    const { impl, calls } = fakeFetch(() => new Response(null, { status: 200 }));
    const monitor = createMonitor(impl, { maxQueue: 3 });
    const list = events(5);
    list.forEach((e) => monitor.capture(e));

    expect(monitor.pending).toBe(3);
    expect(monitor.dropped).toBe(2);
    await monitor.flush();
    expect(calls[0]!.body.events!.map((e) => e.id)).toEqual(list.slice(2).map((e) => e.id));
  });
});

describe('ErrorMonitor failures', () => {
  test('never throws when the monitor is down, and keeps events for a retry', async () => {
    const { impl, calls } = fakeFetch(() => {
      throw new Error('ECONNREFUSED');
    });
    const monitor = createMonitor(impl);
    const [event] = events(1);

    expect(() => monitor.capture(event!)).not.toThrow();
    await expect(monitor.flush()).resolves.toBeUndefined();
    expect(calls).toHaveLength(1);
    expect(monitor.pending).toBe(1);
    expect(await monitor.sendHeartbeat()).toBe(false);
  });

  test('retries with backoff after a 5xx and resends the same event ids', async () => {
    const { impl, calls } = fakeFetch(
      (_, i) => new Response(null, { status: i === 0 ? 503 : 200 }),
    );
    const monitor = createMonitor(impl);
    const [event] = events(1);
    monitor.capture(event!);

    await monitor.flush();
    expect(monitor.pending).toBe(1);
    // The backoff timer (10 ms in this test) sends it again on its own.
    for (let i = 0; i < 50 && monitor.pending; i++) await Bun.sleep(10);

    expect(monitor.pending).toBe(0);
    expect(calls.map((c) => c.body.events![0]!.id)).toEqual([event!.id, event!.id]);
  });

  test('keeps events when the API key is refused', async () => {
    const { impl } = fakeFetch(() => new Response(null, { status: 401 }));
    const monitor = createMonitor(impl);
    events(2).forEach((e) => monitor.capture(e));
    await monitor.flush();
    expect(monitor.pending).toBe(2);
  });

  test('does not hang when the monitor never answers', async () => {
    const { impl } = fakeFetch(() => new Promise<Response>(() => undefined));
    const monitor = createMonitor(impl);
    monitor.capture(events(1)[0]!);
    const started = performance.now();
    await monitor.flushWithin(50);
    expect(performance.now() - started).toBeLessThan(1_000);
  });
});

describe('ErrorMonitor heartbeat', () => {
  test('posts instance, release and times to the heartbeat endpoint', async () => {
    const { impl, calls } = fakeFetch(() => new Response(null, { status: 204 }));
    const monitor = createMonitor(impl);

    expect(await monitor.sendHeartbeat()).toBe(true);
    expect(calls[0]!.url).toBe('https://monitor.test/ingest/v1/heartbeat');
    expect(calls[0]!.body).toMatchObject({
      instance: 'vipex-test',
      release: 'abc123',
      machineName: 'box-1',
    });
    expect(typeof calls[0]!.body.startedAt).toBe('string');
    expect(typeof calls[0]!.body.sentAt).toBe('string');
  });
});
