import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

type Surface = 'dialog' | 'page';

const PRIVATE_PAGES_ROOT = path.join('src', 'pages', '(private)');

const createRouteSurfacePolicy: Record<string, Surface> = {
  '/(configurations)/branches': 'page',
  '/(configurations)/inventory/categories': 'page',
  '/(configurations)/inventory/locations': 'page',
  '/(configurations)/inventory/products': 'page',
  '/(configurations)/inventory/stock-adjustments': 'page',
  '/(configurations)/inventory/stock-count-sessions': 'page',
  '/(configurations)/inventory/stock-lots': 'page',
  '/(configurations)/inventory/stock-maintenance': 'page',
  '/(configurations)/inventory/stock-movements': 'page',
  '/(configurations)/inventory/stock-requests': 'page',
  '/(configurations)/inventory/stock-transfers': 'page',
  '/(configurations)/inventory/tasks': 'page',
  '/(configurations)/inventory/replenishment-proposals': 'page',
  '/(configurations)/inventory/approval-policies': 'page',
  '/(configurations)/inventory/audit/corrections': 'page',
  '/(configurations)/locations': 'page',
  '/customer-wallet-credit/payments': 'page',
  '/customers': 'page',
  '/fleet-transport/fuel-logs': 'page',
  '/fleet-transport/rosters': 'page',
  '/fleet-transport/trips': 'page',
  '/fleet-transport/routes/plans': 'page',
  '/fleet-transport/drivers/training': 'page',
  '/fleet-transport/drivers/compliance': 'page',
  '/fleet-transport/dispatch/load-matching': 'page',
  '/fleet-transport/compliance/ops/policy-acks': 'page',
  '/fleet-transport/compliance/ops/incidents': 'page',
  '/fleet-transport/vehicles/view/[id]/documents': 'page',
  '/fleet-transport/maintenance/work-orders': 'page',
  '/fleet-transport/maintenance/plans': 'page',
  '/fleet-transport/maintenance/downtime': 'page',
  '/fleet-transport/maintenance/parts': 'page',
  '/fleet-transport/maintenance/parts/movements': 'page',
  '/fleet-transport/vehicles': 'page',
  '/hr/employees': 'page',
  '/it-support/tickets': 'page',
  '/notification-hub/campaigns': 'page',
  '/notification-hub/providers': 'dialog',
  '/notification-hub/templates': 'dialog',
  '/procurement/demands': 'page',
  '/procurement/demands/consolidations': 'page',
  '/procurement/fleet-policies': 'page',
  '/procurement/goods-receipts': 'page',
  '/procurement/purchase-orders': 'page',
  '/procurement/purchase-requests': 'page',
  '/procurement/supplier-quotes': 'page',
  '/procurement/suppliers': 'page',
  '/reconciliation/bank-settlements': 'page',
  '/reconciliation/sessions': 'page',
  '/users': 'page',
};

async function walkPages(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const next = path.join(dir, entry.name);
      if (entry.isDirectory()) return walkPages(next);
      if (entry.isFile() && entry.name === 'page.tsx') return [next];
      return [];
    }),
  );
  return files.flat();
}

function toPosix(filePath: string) {
  return filePath.split(path.sep).join('/');
}

function normalizeEntityPath(
  filePath: string,
  suffix: '/new/page.tsx' | '/edit/[id]/page.tsx' | '/create/page.tsx',
) {
  return toPosix(filePath)
    .replace(/^src\/pages\/\(private\)/, '')
    .replace(suffix, '');
}

function readRouteExportBinding(code: string) {
  const exportMatch = code.match(/export default\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*;/);
  if (!exportMatch) return null;
  const exportedName = exportMatch[1];

  const importMatches = [
    ...code.matchAll(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]\s*;/g),
  ];
  for (const match of importMatches) {
    const rawSpecifiers = match[1];
    const importSource = match[2];
    if (!rawSpecifiers || !importSource) continue;
    const specifiers = rawSpecifiers
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [imported, local] = item.split(/\s+as\s+/);
        const importedName = imported?.trim();
        if (!importedName) return null;
        return { imported: importedName, local: (local ?? importedName).trim() };
      });

    if (specifiers.some((specifier) => specifier?.local === exportedName)) {
      return { source: importSource, symbol: exportedName };
    }
  }

  return null;
}

async function main() {
  const files = await walkPages(PRIVATE_PAGES_ROOT);
  const errors: string[] = [];

  const newRoutes = files.filter((file) => toPosix(file).endsWith('/new/page.tsx'));
  const editRoutes = files.filter((file) => toPosix(file).endsWith('/edit/[id]/page.tsx'));
  const createRoutes = files.filter((file) => toPosix(file).endsWith('/create/page.tsx'));

  const newEntities = new Map(
    newRoutes.map((file) => [normalizeEntityPath(file, '/new/page.tsx'), file]),
  );
  const editEntities = new Map(
    editRoutes.map((file) => [normalizeEntityPath(file, '/edit/[id]/page.tsx'), file]),
  );

  for (const entityPath of newEntities.keys()) {
    if (!(entityPath in createRouteSurfacePolicy)) {
      errors.push(
        `Missing create-surface policy for "${entityPath}". Add it to createRouteSurfacePolicy in scripts/enforce-create-edit-architecture.ts.`,
      );
      continue;
    }
  }

  for (const [entityPath, newFile] of newEntities) {
    const editFile = editEntities.get(entityPath);
    if (!editFile) continue;

    const [newCode, editCode] = await Promise.all([
      readFile(newFile, 'utf8'),
      readFile(editFile, 'utf8'),
    ]);
    const newBinding = readRouteExportBinding(newCode);
    const editBinding = readRouteExportBinding(editCode);

    if (!newBinding || !editBinding) {
      errors.push(
        `Routes for "${entityPath}" must use "import { SharedCreateEditPage } ...; export default SharedCreateEditPage;" pattern.`,
      );
      continue;
    }

    if (newBinding.source !== editBinding.source || newBinding.symbol !== editBinding.symbol) {
      errors.push(
        `Routes for "${entityPath}" must share the exact same create/edit component. Found new=${newBinding.source}#${newBinding.symbol}, edit=${editBinding.source}#${editBinding.symbol}.`,
      );
    }
  }

  for (const createFile of createRoutes) {
    const entityPath = normalizeEntityPath(createFile, '/create/page.tsx');
    if (!newEntities.has(entityPath)) {
      continue;
    }

    const code = await readFile(createFile, 'utf8');
    const isRedirect =
      code.includes('Navigate') && /<Navigate\s+to=['"][^'"]+\/new['"]\s+replace\s*\/>/.test(code);
    if (!isRedirect) {
      errors.push(
        `Legacy "/create" route "${toPosix(createFile)}" must redirect to its "/new" route using <Navigate ... replace />.`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('Create/Edit architecture check failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Create/Edit architecture check passed. Verified ${newRoutes.length} create routes, ${editRoutes.length} edit routes, and ${createRoutes.length} legacy create redirects.`,
  );
}

await main();
