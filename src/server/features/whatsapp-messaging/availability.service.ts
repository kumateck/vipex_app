import { isWhatsAppConfigured } from '../notification-hub/providers';
import { findCompanyModuleRepo } from '../company-modules/repository';
import { findWhatsAppProviderRepo } from './repository';

export const WHATSAPP_MODULE_CODE = 'whatsapp_messaging';

/** Whether WhatsApp can be offered to staff for this company right now. */
export async function getWhatsAppAvailabilitySvc(companyId: string) {
  const [module, provider] = await Promise.all([
    findCompanyModuleRepo(companyId, WHATSAPP_MODULE_CODE),
    findWhatsAppProviderRepo(companyId),
  ]);
  const moduleEnabled = Boolean(module?.isEnabled);
  const configured = Boolean(
    provider?.isActive && provider.isDefault && isWhatsAppConfigured(provider.configJson),
  );
  return { moduleEnabled, configured, available: moduleEnabled && configured };
}
