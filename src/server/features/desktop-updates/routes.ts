import { Elysia } from 'elysia';
import { getMacosDesktopUpdateResponseSvc, getWindowsDesktopUpdateResponseSvc } from './service';

export const desktopUpdatesRoutes = new Elysia({ name: 'desktop-updates' })
  .get(
    '/windows/latest/*',
    async ({ params }) => {
      const fileName = (params as { '*': string })['*'];
      return getWindowsDesktopUpdateResponseSvc(fileName);
    },
    {
      detail: {
        tags: ['Desktop Updates'],
        summary: 'Stream a Windows desktop update artifact through the app server',
      },
    },
  )
  .get(
    '/macos/latest/*',
    async ({ params }) => {
      const fileName = (params as { '*': string })['*'];
      return getMacosDesktopUpdateResponseSvc(fileName);
    },
    {
      detail: {
        tags: ['Desktop Updates'],
        summary: 'Stream a macOS desktop update artifact through the app server',
      },
    },
  );
