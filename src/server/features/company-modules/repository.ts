import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { companies, companyModules, moduleCatalog } from '@/db/schemas';

export async function listModuleCatalogRepo() {
  return db
    .select({
      id: moduleCatalog.id,
      code: moduleCatalog.code,
      name: moduleCatalog.name,
      description: moduleCatalog.description,
      isCore: moduleCatalog.isCore,
      isActive: moduleCatalog.isActive,
    })
    .from(moduleCatalog)
    .orderBy(asc(moduleCatalog.name), asc(moduleCatalog.id));
}

export async function listCompanyModulesRepo(companyId: string) {
  return db
    .select({
      id: companyModules.id,
      companyId: companyModules.companyId,
      moduleCode: companyModules.moduleCode,
      isEnabled: companyModules.isEnabled,
      enabledAt: companyModules.enabledAt,
      disabledAt: companyModules.disabledAt,
      configuredBy: companyModules.configuredBy,
      settings: companyModules.settings,
      createdAt: companyModules.createdAt,
      updatedAt: companyModules.updatedAt,
    })
    .from(companyModules)
    .where(eq(companyModules.companyId, companyId))
    .orderBy(asc(companyModules.moduleCode));
}

export async function findCompanyModuleRepo(companyId: string, moduleCode: string) {
  const [row] = await db
    .select({
      id: companyModules.id,
      companyId: companyModules.companyId,
      moduleCode: companyModules.moduleCode,
      isEnabled: companyModules.isEnabled,
      enabledAt: companyModules.enabledAt,
      disabledAt: companyModules.disabledAt,
      configuredBy: companyModules.configuredBy,
      settings: companyModules.settings,
      createdAt: companyModules.createdAt,
      updatedAt: companyModules.updatedAt,
    })
    .from(companyModules)
    .where(and(eq(companyModules.companyId, companyId), eq(companyModules.moduleCode, moduleCode)))
    .limit(1);

  return row ?? null;
}

export async function findCatalogModulesRepo(codes: string[]) {
  if (!codes.length) return [];
  return db
    .select({
      code: moduleCatalog.code,
      isActive: moduleCatalog.isActive,
    })
    .from(moduleCatalog)
    .where(inArray(moduleCatalog.code, codes));
}

export async function upsertCompanyModuleRepo(input: {
  companyId: string;
  moduleCode: string;
  isEnabled: boolean;
  configuredBy?: string | null;
  settings?: unknown;
}) {
  const existing = await findCompanyModuleRepo(input.companyId, input.moduleCode);
  if (existing) {
    const [row] = await db
      .update(companyModules)
      .set({
        isEnabled: input.isEnabled,
        enabledAt: input.isEnabled ? new Date() : existing.enabledAt,
        disabledAt: input.isEnabled ? null : new Date(),
        configuredBy: input.configuredBy ?? null,
        settings: input.settings,
      })
      .where(eq(companyModules.id, existing.id))
      .returning({ id: companyModules.id });
    return row ?? null;
  }

  const [created] = await db
    .insert(companyModules)
    .values({
      companyId: input.companyId,
      moduleCode: input.moduleCode,
      isEnabled: input.isEnabled,
      enabledAt: input.isEnabled ? new Date() : null,
      disabledAt: input.isEnabled ? null : new Date(),
      configuredBy: input.configuredBy ?? null,
      settings: input.settings,
    })
    .returning({ id: companyModules.id });

  return created ?? null;
}

export async function updateCompanyAccountingFlagRepo(input: {
  companyId: string;
  useAccounting: boolean;
}) {
  const [row] = await db
    .update(companies)
    .set({ useAccounting: input.useAccounting, updatedAt: new Date() })
    .where(eq(companies.id, input.companyId))
    .returning({ id: companies.id });

  return row ?? null;
}
