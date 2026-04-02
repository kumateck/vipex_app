import { Elysia } from 'elysia';
import { CommunicationThreadsRoutes } from './threads/routes';
import { CommunicationMessagesRoutes } from './messages/routes';
import { CommunicationChannelsRoutes } from './channels/routes';
import { CommunicationGroupsRoutes } from './groups/routes';
import { CommunicationEngagementRequestsRoutes } from './engagement-requests/routes';
import { CommunicationPresenceRoutes } from './presence/routes';
import { CommunicationCallsRoutes } from './calls/routes';

export const communicationRoutes = new Elysia({ name: 'communication' })
  .group('/threads', (r) => r.use(CommunicationThreadsRoutes))
  .group('/messages', (r) => r.use(CommunicationMessagesRoutes))
  .group('/channels', (r) => r.use(CommunicationChannelsRoutes))
  .group('/groups', (r) => r.use(CommunicationGroupsRoutes))
  .group('/engagement-requests', (r) => r.use(CommunicationEngagementRequestsRoutes))
  .group('/presence', (r) => r.use(CommunicationPresenceRoutes))
  .group('/calls', (r) => r.use(CommunicationCallsRoutes));
