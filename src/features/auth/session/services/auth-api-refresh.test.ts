import { afterEach, expect, test } from 'bun:test';
import { authApi } from '@/features/auth/api';
import { store } from '@/store';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

const staff = { id: 'staff-1', fullname: 'Test Staff', email: 'staff@example.test' } as AuthUser;
const originalFetch = globalThis.fetch;

function signIn() {
  useAuthStore.getState().setAuth({
    user: staff,
    accessToken: 'old-access',
    refreshToken: 'old-refresh',
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().logout();
  store.dispatch(authApi.util.resetApiState());
});

test('manual refresh keeps the login when the server is temporarily unavailable', async () => {
  signIn();
  globalThis.fetch = (async () => new Response(null, { status: 503 })) as unknown as typeof fetch;

  const result = await store.dispatch(
    authApi.endpoints.refreshToken.initiate({ refreshToken: 'old-refresh' }),
  );
  expect(result.error).toBeDefined();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(useAuthStore.getState().refreshToken).toBe('old-refresh');
});

test('manual refresh signs out only after a confirmed invalid session', async () => {
  signIn();
  globalThis.fetch = (async () => new Response(null, { status: 401 })) as unknown as typeof fetch;

  const result = await store.dispatch(
    authApi.endpoints.refreshToken.initiate({ refreshToken: 'old-refresh' }),
  );
  expect(result.error).toMatchObject({ status: 401 });
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

test('a mutation from the previous branch cannot retry with the new branch token', async () => {
  const source = { ...staff, branch: { id: 'source', name: 'Source' } };
  const destination = { ...staff, branch: { id: 'target', name: 'Target' } };
  useAuthStore.getState().setAuth({
    user: source,
    accessToken: 'old-access',
    refreshToken: 'old-refresh',
  });
  const operations = authApi.injectEndpoints({
    endpoints: (builder) => ({
      branchMutation: builder.mutation<void, void>({
        query: () => ({ url: 'https://example.test/branch-operation', method: 'POST' }),
      }),
    }),
  });
  let start!: () => void;
  const requestStarted = new Promise<void>((resolve) => {
    start = resolve;
  });
  let respond!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    respond = resolve;
  });
  let requests = 0;
  globalThis.fetch = (async () => {
    requests += 1;
    start();
    return pending;
  }) as unknown as typeof fetch;

  const mutation = store.dispatch(operations.endpoints.branchMutation.initiate());
  await requestStarted;
  useAuthStore.getState().setAuth({
    user: destination,
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
  });
  respond(new Response(null, { status: 401 }));
  expect(await mutation).toMatchObject({ error: { status: 'CUSTOM_ERROR' } });
  expect(requests).toBe(1);
  expect(useAuthStore.getState().user?.branch?.id).toBe('target');
});
