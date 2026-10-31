import { Elysia } from 'elysia';
import { routes as routes0 } from './queues';
import { routes as routes1 } from './queries';
import { routes as routes2 } from './mutations';
import { routes as routes3 } from './reconciliation';
import { routes as routes4 } from './call-outcomes';
import { routes as routes5 } from './delivery-actions';
import { routes as routes6 } from './receiving';
import { routes as routes7 } from './payments-and-shelf';
export const parcelsRoutes = new Elysia({ name: 'parcels' })
  .use(routes0)
  .use(routes1)
  .use(routes2)
  .use(routes3)
  .use(routes4)
  .use(routes5)
  .use(routes6)
  .use(routes7);
