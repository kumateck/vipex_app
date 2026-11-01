import { Elysia } from 'elysia';
import { customersRoutes1 } from './customer-routes/customer-directory.routes';
import { customersRoutes2 } from './customer-routes/customer-financial.routes';
import { customersRoutes3 } from './customer-routes/customer-mutations.routes';
export const customersRoutes = new Elysia({ name: 'customers' })
  .use(customersRoutes1)
  .use(customersRoutes2)
  .use(customersRoutes3);
