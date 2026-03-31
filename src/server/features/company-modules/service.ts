import { BadRequest, Conflict, Forbidden } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  findCatalogModulesRepo,
  findCompanyModuleRepo,
  listCompanyModulesRepo,
  listModuleCatalogRepo,
  updateCompanyAccountingFlagRepo,
  upsertCompanyModuleRepo,
} from './repository';

export const MODULE_DEPENDENCIES: Record<string, string[]> = {
  payroll: ['hr'],
  procurement: ['accounting'],
  fleet_transport: ['shipments'],
  customer_wallet_credit: ['customers', 'payments'],
  sla_claims: ['shipments', 'customers'],
  reconciliation: ['payments', 'accounting'],
  document_compliance: ['customers'],
  dispatch_optimization: ['shipments'],
  notification_hub: ['customers'],
  communication_internal: [],
  communication_customer_service: ['customers', 'communication_internal'],
  communication_calls_livekit: ['communication_internal'],
  it_support: [],
  bi_executive_dashboard: ['accounting'],
  partner_agent_portal: ['shipments', 'customers', 'payments'],
};

async function ensureModuleExists(moduleCode: string) {
  const modules = await findCatalogModulesRepo([moduleCode]);
  const module = modules[0];
  if (!module) throw BadRequest(`Unknown module: ${moduleCode}`);
  if (!module.isActive) throw Conflict(`Module ${moduleCode} is not active`);
}

export async function listCompanyModulesSvc(companyId: string) {
  const [catalog, enabled] = await Promise.all([
    listModuleCatalogRepo(),
    listCompanyModulesRepo(companyId),
  ]);

  const enabledByCode = new Map(enabled.map((row) => [row.moduleCode, row]));
  return catalog.map((module) => {
    const state = enabledByCode.get(module.code);
    return {
      ...module,
      isEnabled: state?.isEnabled ?? false,
      enabledAt: state?.enabledAt ?? null,
      disabledAt: state?.disabledAt ?? null,
      configuredBy: state?.configuredBy ?? null,
      settings: state?.settings ?? null,
    };
  });
}

export async function ensureCompanyModuleEnabledSvc(companyId: string, moduleCode: string) {
  const existing = await findCompanyModuleRepo(companyId, moduleCode);
  if (!existing?.isEnabled) {
    throw Forbidden(`Module "${moduleCode}" is not enabled for this company`);
  }
  return existing;
}

export async function setCompanyModuleStateSvc(input: {
  companyId: string;
  moduleCode: string;
  isEnabled: boolean;
  configuredBy?: string | null;
  settings?: unknown;
}) {
  await ensureModuleExists(input.moduleCode);

  if (input.isEnabled) {
    const dependencies = MODULE_DEPENDENCIES[input.moduleCode] ?? [];
    for (const dependency of dependencies) {
      const state = await findCompanyModuleRepo(input.companyId, dependency);
      if (!state?.isEnabled) {
        throw Conflict(`Module "${input.moduleCode}" requires "${dependency}" to be enabled first`);
      }
    }
  } else {
    const dependents = Object.entries(MODULE_DEPENDENCIES)
      .filter(([, dependencies]) => dependencies.includes(input.moduleCode))
      .map(([moduleCode]) => moduleCode);

    if (dependents.length) {
      const activeDependents = await Promise.all(
        dependents.map(async (moduleCode) => {
          const state = await findCompanyModuleRepo(input.companyId, moduleCode);
          return state?.isEnabled ? moduleCode : null;
        }),
      );
      const blockingModules = activeDependents.filter((value): value is string => Boolean(value));
      if (blockingModules.length) {
        throw Conflict(
          `Cannot disable "${input.moduleCode}" while dependent modules are enabled: ${blockingModules.join(', ')}`,
        );
      }
    }
  }

  const result = await upsertCompanyModuleRepo(input);
  if (input.moduleCode === 'accounting') {
    await updateCompanyAccountingFlagRepo({
      companyId: input.companyId,
      useAccounting: input.isEnabled,
    });
  }
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.configuredBy ?? null,
    entityType: 'company_module',
    entityId: result?.id ?? null,
    action: input.isEnabled ? 'COMPANY_MODULE_ENABLED' : 'COMPANY_MODULE_DISABLED',
    message: `Module ${input.moduleCode} ${input.isEnabled ? 'enabled' : 'disabled'}`,
    metadata: {
      moduleCode: input.moduleCode,
      isEnabled: input.isEnabled,
      settings: input.settings ?? null,
    },
  });

  return { id: result?.id };
}
