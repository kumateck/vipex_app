import { Elysia } from 'elysia';
import { authPlugin, requireAuth } from '@/server/plugins/auth';
import { getWindowsDesktopUpdateObjectSvc } from './service';

export const desktopUpdatesRoutes = new Elysia({ name: 'desktop-updates' }).use(authPlugin).get(
  '/windows/latest/*',
  async ({ params }) => {
    const fileName = (params as { '*': string })['*'];
    return getWindowsDesktopUpdateObjectSvc(fileName);
  },
  {
    beforeHandle: [requireAuth()],
    detail: {
      tags: ['Desktop Updates'],
      summary: 'Read a private Windows desktop update artifact through the app proxy',
    },
  },
);
