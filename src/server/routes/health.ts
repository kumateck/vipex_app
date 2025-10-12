import { Elysia } from 'elysia';

export const health = new Elysia({ name: 'health' }).get('/health', () => ({
  status: 'ok',
  uptime: process.uptime(),
  now: new Date().toISOString(),
}));
