import { Elysia } from 'elysia';

export const requestId = new Elysia({ name: 'request-id' }).derive(({ request, set }) => {
  const id = request.headers.get('x-request-id') ?? crypto.randomUUID();
  set.headers['x-request-id'] = id;
  return { requestId: id as string };
});
