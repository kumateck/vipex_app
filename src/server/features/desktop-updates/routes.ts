import { Elysia } from 'elysia';
import { authPlugin, requireAuth } from '@/server/plugins/auth';
import { getWindowsDesktopUpdateResponseSvc } from './service';

export const desktopUpdatesRoutes = new Elysia({ name: 'desktop-updates' }).use(authPlugin).get(
  '/windows/latest/*',
  async ({ params }) => {
    const fileName = (params as { '*': string })['*'];
    return getWindowsDesktopUpdateResponseSvc(fileName);
  },
  {
    beforeHandle: [requireAuth()],
    detail: {
      tags: ['Desktop Updates'],
      summary: 'Stream a private Windows desktop update artifact through the app server',
    },
  },
);
