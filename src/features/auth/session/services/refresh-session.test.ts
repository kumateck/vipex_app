import { afterEach, expect, test } from 'bun:test';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { refreshAuthSession } from './refresh-session';

const staff = { id: 'staff-1', fullname: 'Test Staff', email: 'staff@example.test' } as AuthUser;

function signIn() {
  useAuthStore.getState().setAuth({
    user: staff,
    accessToken: 'old-access',
    refreshToken: 'old-refresh',
  });
}

afterEach(() => useAuthStore.getState().logout());

test('refresh rotates both tokens and coalesces concurrent callers', async () => {
  signIn();
  let requests = 0;
  const request = async (_input: RequestInfo | URL, init?: RequestInit) => {
    requests += 1;
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'old-refresh' });
    return Response.json({
      tokens: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      user: staff,
    });
  };

  const [first, second] = await Promise.all([
    refreshAuthSession(request),
    refreshAuthSession(request),
  ]);
  expect(first.status).toBe('refreshed');
  expect(second.status).toBe('refreshed');
  expect(requests).toBe(1);
  expect(useAuthStore.getState().accessToken).toBe('new-access');
  expect(useAuthStore.getState().refreshToken).toBe('new-refresh');
});

test('offline and server failures preserve the existing login for retry', async () => {
  signIn();
  expect((await refreshAuthSession(async () => new Response(null, { status: 503 }))).status).toBe(
    'unavailable',
  );
  expect(
    (
      await refreshAuthSession(async () => {
        throw new Error('offline');
      })
    ).status,
  ).toBe('unavailable');
  expect(useAuthStore.getState().refreshToken).toBe('old-refresh');
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

test('confirmed invalid refresh is distinct from a temporary outage', async () => {
  signIn();
  expect((await refreshAuthSession(async () => new Response(null, { status: 401 }))).status).toBe(
    'invalid',
  );
});

test('a stalled refresh times out without deleting the login', async () => {
  signIn();
  const result = await refreshAuthSession(
    async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('timed out')), {
          once: true,
        });
      }),
    5,
  );
  expect(result.status).toBe('unavailable');
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

test('a response arriving after logout cannot restore the old session', async () => {
  signIn();
  let respond!: (response: Response) => void;
  const pending = refreshAuthSession(
    async () =>
      new Promise<Response>((resolve) => {
        respond = resolve;
      }),
  );
  useAuthStore.getState().logout();
  respond(
    Response.json({
      tokens: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      user: staff,
    }),
  );
  expect((await pending).status).toBe('superseded');
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

test('an old in-flight refresh cannot block or overwrite a newly signed-in user', async () => {
  signIn();
  let respond!: (response: Response) => void;
  const oldRequest = refreshAuthSession(
    async () =>
      new Promise<Response>((resolve) => {
        respond = resolve;
      }),
  );
  const nextUser = { ...staff, id: 'staff-2' };
  useAuthStore.getState().setAuth({
    user: nextUser,
    accessToken: 'other-access',
    refreshToken: 'other-refresh',
  });

  const nextRequest = await refreshAuthSession(async () =>
    Response.json({
      tokens: { accessToken: 'other-new-access', refreshToken: 'other-new-refresh' },
      user: nextUser,
    }),
  );
  respond(
    Response.json({
      tokens: { accessToken: 'old-new-access', refreshToken: 'old-new-refresh' },
      user: staff,
    }),
  );

  expect(nextRequest.status).toBe('refreshed');
  expect((await oldRequest).status).toBe('superseded');
  expect(useAuthStore.getState().user?.id).toBe('staff-2');
  expect(useAuthStore.getState().accessToken).toBe('other-new-access');
});
