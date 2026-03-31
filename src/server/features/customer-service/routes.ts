import { Elysia } from 'elysia';
import { CustomerServiceTicketsRoutes } from './tickets/routes';
import { CustomerServiceConversationsRoutes } from './conversations/routes';
import { CustomerServiceFeedbackRoutes } from './feedback/routes';
import { CustomerServiceSlaRoutes } from './sla/routes';

export const customerServiceRoutes = new Elysia({ name: 'customer-service' })
  .group('/tickets', (r) => r.use(CustomerServiceTicketsRoutes))
  .group('/conversations', (r) => r.use(CustomerServiceConversationsRoutes))
  .group('/feedback', (r) => r.use(CustomerServiceFeedbackRoutes))
  .group('/sla', (r) => r.use(CustomerServiceSlaRoutes));
