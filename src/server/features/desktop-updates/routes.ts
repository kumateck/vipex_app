import { Elysia } from 'elysia';
import { authPlugin, requireAuth } from '@/server/plugins/auth';
import { getWindowsDesktopUpdateRedirectUrlSvc } from './service';

export const desktopUpdatesRoutes = new Elysia({ name: 'desktop-updates' }).use(authPlugin).get(
  '/windows/latest/*',
  async ({ params, redirect }) => {
    const fileName = (params as { '*': string })['*'];
    const url = await getWindowsDesktopUpdateRedirectUrlSvc(fileName);
    return redirect(url, 302);
  },
  {
    beforeHandle: [requireAuth()],
    detail: {
      tags: ['Desktop Updates'],
      summary:
        'Redirect to a short-lived presigned MinIO URL for a private Windows desktop update artifact',
    },
  },
);
