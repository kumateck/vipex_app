import { Elysia } from 'elysia';
import { ItSupportTicketsRoutes } from './tickets/routes';

export const itSupportRoutes = new Elysia({ name: 'it-support' }).group('/tickets', (r) =>
  r.use(ItSupportTicketsRoutes),
);
