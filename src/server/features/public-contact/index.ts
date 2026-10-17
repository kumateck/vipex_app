export { customerContactRoutes } from './staff.routes';

import { env } from '@/server/utils/env';
import { createPublicContactRoutes } from './routes';
import { isWebsiteContactEnabledRepo, saveWebsiteContactRepo } from './repository';

export const publicContactRoutes = createPublicContactRoutes({
  companyId: () => env.WEBSITE_CONTACT_COMPANY_ID,
  isEnabled: isWebsiteContactEnabledRepo,
  save: saveWebsiteContactRepo,
});
