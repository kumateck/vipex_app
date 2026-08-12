import { Elysia } from 'elysia';
import { authPlugin, requireAuth } from '@/server/plugins/auth';
import { getLatestAndroidMobileUpdateSvc } from './service';

export const mobileUpdatesRoutes = new Elysia({ name: 'mobile-updates' })
  .use(authPlugin)
  .get('/android/latest', () => getLatestAndroidMobileUpdateSvc(), {
    beforeHandle: [requireAuth()],
    detail: {
      tags: ['Mobile Updates'],
      summary: 'Get the latest private Android APK release metadata and download URL',
    },
  });
