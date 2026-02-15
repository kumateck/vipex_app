/**
 * Bun-only route generator for React Router v7.
 *
 * Scans:  src/pages/**{page,layout,loading,error}.{ts,tsx}
 * Writes: src/routes/generated.tsx
 *
 * Run:
 *   bun scripts/generate-routes.ts
 *   bun scripts/generate-routes.ts --watch
 */

type RouteKind = 'page' | 'layout' | 'loading' | 'error';

interface RouteInfo {
  kind: RouteKind;
  routePath: string; // "/", "/blog/$id", "*", etc.
  filePath: string; // relative to src/pages, POSIX: "blog/[id]/page.tsx"
  componentName: string; // safe TS identifier
  depth: number; // folder depth

  isDynamic: boolean;
  isCatchAll: boolean;

  isPage: boolean;
  isLayout: boolean;
  isLoading: boolean;
  isError: boolean;
}

const PAGES_DIR = 'src/pages';
const OUTPUT_FILE = 'src/routes/generated.tsx';

/* --------------------------- POSIX path utilities -------------------------- */

function posix(p: string): string {
  return p.replaceAll('\\', '/');
}

function stripLeadingSlashes(p: string): string {
  return p.replace(/^\/+/, '');
}

function stripTrailingSlashes(p: string): string {
  return p.replace(/\/+$/, '');
}

function dirnamePosix(p: string): string {
  const s = stripTrailingSlashes(posix(p));
  const i = s.lastIndexOf('/');
  return i === -1 ? '' : s.slice(0, i);
}

function splitSegments(p: string): string[] {
  const s = stripLeadingSlashes(stripTrailingSlashes(posix(p)));
  return s ? s.split('/').filter(Boolean) : [];
}

function depthFromRelativeFilePath(filePath: string): number {
  const d = dirnamePosix(filePath);
  return d ? splitSegments(d).length : 0;
}

/* ------------------------------- Conventions ------------------------------ */

function detectKind(relativeToPages: string): RouteKind | null {
  const name = posix(relativeToPages).split('/').pop() ?? '';
  if (/^page\.(ts|tsx)$/.test(name)) return 'page';
  if (/^layout\.(ts|tsx)$/.test(name)) return 'layout';
  if (/^loading\.(ts|tsx)$/.test(name)) return 'loading';
  if (/^error\.(ts|tsx)$/.test(name)) return 'error';
  return null;
}

function sanitizeComponentName(filePath: string): string {
  // Ensure a stable, safe identifier.
  return filePath
    .replace(/[\/\\\-\[\]\.\(\)\s]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .replace(/page$/, 'Page')
    .replace(/layout$/, 'Layout')
    .replace(/loading$/, 'Loading')
    .replace(/error$/, 'Error');
}

function fileToRoutePath(relativeToPages: string): string {
  const rel = posix(relativeToPages);

  // ✅ Special-case root files
  if (/^page\.(tsx|ts)$/.test(rel)) return '/';
  if (/^layout\.(tsx|ts)$/.test(rel)) return '/';

  let r = rel
    .replace(/\/page\.(tsx|ts)$/, '')
    .replace(/\/layout\.(tsx|ts)$/, '')
    .replace(/\/loading\.(tsx|ts)$/, '')
    .replace(/\/error\.(tsx|ts)$/, '');

  // Remove route groups: (group)
  r = r.replace(/\(([^)]+)\)/g, '');

  // Dynamic segments:
  // [id] -> $id
  // [...slug] -> *
  r = r.replace(/\[([^\]]+)\]/g, (_m, param: string) => {
    if (param.startsWith('...')) return '*';
    return `$${param}`;
  });

  r = '/' + stripLeadingSlashes(r);
  r = r === '/' ? '/' : r.replace(/\/+$/, '');
  return r;
}

// ----------------------------------------------------------------------------
// ✅ Grouping by filesystem directory instead of by routePath prefix
// ----------------------------------------------------------------------------

function dirOfRouteFile(filePath: string): string {
  // filePath is relative to src/pages, POSIX
  // e.g. "(main)/layout.tsx" -> "(main)"
  return dirnamePosix(posix(filePath));
}

function isUnderDir(parentDir: string, childFilePath: string): boolean {
  const parent = stripTrailingSlashes(posix(parentDir));
  const child = posix(childFilePath);

  if (parent === '') return true; // root layout can wrap everything
  return child === parent || child.startsWith(parent + '/');
}

function isCatchAllRoute(routePath: string): boolean {
  return splitSegments(routePath).includes('*') || routePath === '*';
}

function isDynamicRoute(routePath: string): boolean {
  return splitSegments(routePath).some((s) => s.startsWith('$')) || isCatchAllRoute(routePath);
}

/**
 * Segment-aware prefix match:
 * "/admin" matches "/admin/users" but NOT "/administration".
 */
function isRoutePrefix(parent: string, child: string): boolean {
  if (parent === '/') return true;

  const a = splitSegments(parent);
  const b = splitSegments(child);
  if (a.length > b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/* -------------------------------- Discovery ------------------------------- */

async function discoverRouteFiles(): Promise<string[]> {
  const patterns = [
    `${PAGES_DIR}/**/page.{ts,tsx}`,
    `${PAGES_DIR}/**/layout.{ts,tsx}`,
    `${PAGES_DIR}/**/loading.{ts,tsx}`,
    `${PAGES_DIR}/**/error.{ts,tsx}`,
  ];

  const cwd = process.cwd();
  const found = new Set<string>();

  for (const pat of patterns) {
    const glob = new Bun.Glob(pat);
    for await (const match of glob.scan({ cwd, onlyFiles: true })) {
      found.add(posix(match));
    }
  }

  return [...found].sort((a, b) => a.localeCompare(b));
}

function stripPrefixToPagesDir(fullPath: string): string {
  // glob results are usually relative to cwd; handle both relative and absolute robustly
  const full = posix(fullPath);
  const base = stripTrailingSlashes(posix(PAGES_DIR));

  if (full === base) return '';
  if (full.startsWith(base + '/')) return full.slice(base.length + 1);

  const needle = base + '/';
  const idx = full.indexOf(needle);
  if (idx !== -1) return full.slice(idx + needle.length);

  return full; // fallback (should not happen)
}

/* ---------------------------- Tree building logic -------------------------- */

function buildRouteInfos(relativeFiles: string[]): RouteInfo[] {
  const routes: RouteInfo[] = [];

  for (const rel of relativeFiles) {
    const kind = detectKind(rel);
    if (!kind) continue;

    const routePath = fileToRoutePath(rel);
    const componentName = sanitizeComponentName(rel);
    const depth = depthFromRelativeFilePath(rel);

    routes.push({
      kind,
      routePath,
      filePath: posix(rel),
      componentName,
      depth,
      isCatchAll: isCatchAllRoute(routePath),
      isDynamic: isDynamicRoute(routePath),
      isPage: kind === 'page',
      isLayout: kind === 'layout',
      isLoading: kind === 'loading',
      isError: kind === 'error',
    });
  }

  // Deterministic order.
  routes.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.filePath.localeCompare(b.filePath);
  });

  return routes;
}

function groupPagesUnderLayouts(routes: RouteInfo[]) {
  const layouts = routes.filter((r) => r.isLayout);
  const pages = routes.filter((r) => r.isPage);

  const groups = new Map<string, RouteInfo[]>();

  for (const page of pages) {
    let best: RouteInfo | null = null;

    for (const layout of layouts) {
      // ✅ Only layouts in the same folder tree can own the page
      const layoutDir = dirOfRouteFile(layout.filePath);
      if (!isUnderDir(layoutDir, page.filePath)) continue;

      // Prefer the most specific (deepest) layout
      if (!best || layout.depth > best.depth) best = layout;
    }

    const key = best ? best.componentName : '';
    const bucket = groups.get(key) ?? [];
    bucket.push(page);
    groups.set(key, bucket);
  }

  // Stable child ordering
  for (const [k, list] of groups.entries()) {
    list.sort((a, b) => {
      const rp = a.routePath.localeCompare(b.routePath);
      return rp !== 0 ? rp : a.filePath.localeCompare(b.filePath);
    });
    groups.set(k, list);
  }

  // Stable layout ordering (root layout first, then deeper)
  layouts.sort((a, b) => a.depth - b.depth || a.filePath.localeCompare(b.filePath));

  return { layouts, pages, groups };
}

function computeChildPath(layoutPath: string, pagePath: string): string | null {
  // null -> index route
  if (layoutPath === '/') {
    const child = stripLeadingSlashes(pagePath);
    return child === '' ? null : child;
  }

  if (!isRoutePrefix(layoutPath, pagePath)) return null;

  const layoutSegs = splitSegments(layoutPath);
  const pageSegs = splitSegments(pagePath);
  const remainder = pageSegs.slice(layoutSegs.length).join('/');

  return remainder === '' ? null : remainder;
}

/* -------------------------------- Codegen -------------------------------- */

function generateCode(
  layouts: RouteInfo[],
  pages: RouteInfo[],
  groups: Map<string, RouteInfo[]>,
): string {
  const now = new Date().toISOString();

  // We only emit layouts + pages into the route config (same as your original script).
  const emit = [...layouts, ...pages];

  const importLines = emit.map(
    (r) => `const ${r.componentName} = lazy(() => import('@/pages/${r.filePath}'));`,
  );

  const routeLines: string[] = [];
  const publicPages = groups.get('') ?? [];

  for (const p of publicPages) {
    if (p.isCatchAll) routeLines.push(`  { path: '*', Component: ${p.componentName} },`);
    else routeLines.push(`  { path: '${p.routePath}', Component: ${p.componentName} },`);
  }

  for (const layout of layouts) {
    const children = groups.get(layout.componentName) ?? [];
    if (children.length === 0) continue;

    routeLines.push(`  {`);
    routeLines.push(`    path: '${layout.routePath}',`);
    routeLines.push(`    Component: ${layout.componentName},`);
    routeLines.push(`    children: [`);

    for (const p of children) {
      const childPath = computeChildPath(layout.routePath, p.routePath);

      if (childPath == null) {
        routeLines.push(`      { index: true, Component: ${p.componentName} },`);
      } else if (p.isCatchAll) {
        routeLines.push(`      { path: '*', Component: ${p.componentName} },`);
      } else {
        routeLines.push(`      { path: '${childPath}', Component: ${p.componentName} },`);
      }
    }

    routeLines.push(`    ],`);
    routeLines.push(`  },`);
  }

  return `// 🚀 Auto-generated by scripts/generate-routes.ts
// ⚠️  DO NOT EDIT MANUALLY
// Generated at: ${now}
//
// Convention:
// - page.tsx   = Route page
// - layout.tsx = Layout wrapper
// - loading.tsx/error.tsx are discovered but not emitted unless you wire them up explicitly.

import { lazy } from 'react';

${importLines.join('\n')}

// React Router v7 routes
export const routes = [
${routeLines.join('\n')}
];
`;
}

/* ---------------------------------- I/O ---------------------------------- */

// async function ensureOutputDirExists(): Promise<void> {
//   const outDir = dirnamePosix(OUTPUT_FILE);
//   if (!outDir) return;

//   // Bun-only: create directory via OS mkdir using Bun.spawn (macOS/Linux).
//   const proc = Bun.spawn(['mkdir', '-p', outDir], {
//     stdout: 'ignore',
//     stderr: 'inherit',
//   });

//   const exitCode = await proc.exited;
//   if (exitCode !== 0) throw new Error(`Failed to create directory: ${outDir}`);
// }

// async function ensureOutputDirExists(): Promise<void> {
//   const outDir = dirnamePosix(OUTPUT_FILE);
//   if (!outDir) return;

//   const isWindows = process.platform === 'win32';
//   const cmd = isWindows
//     ? ['cmd', '/c', 'mkdir', outDir.replace(/\//g, '\\')]
//     : ['mkdir', '-p', outDir];

//   const proc = Bun.spawn(cmd, {
//     stdout: 'ignore',
//     stderr: 'inherit',
//   });

//   const exitCode = await proc.exited;
//   if (exitCode !== 0) throw new Error(`Failed to create directory: ${outDir}`);
// }
async function ensureOutputDirExists(): Promise<void> {
  const outDir = dirnamePosix(OUTPUT_FILE);
  if (!outDir) return;

  await Bun.$`mkdir -p ${outDir}`;
}
/**
 * Bun-only change detection:
 * Re-scan using Bun.Glob and compute a cheap signature for each discovered file.
 *
 * Uses (path + size) so most content edits trigger regeneration without reading file contents.
 * If you need perfect detection (even when size doesn't change), we can hash file contents instead.
 */
async function computeRoutesFingerprint(): Promise<string> {
  const full = await discoverRouteFiles();
  const parts: string[] = [];

  for (const p of full) {
    const f = Bun.file(p);
    parts.push(`${p}:${f.size}`);
  }

  parts.sort((a, b) => a.localeCompare(b));
  return parts.join('\n');
}

/* ---------------------------------- Main --------------------------------- */

async function generateRoutes(): Promise<void> {
  const full = await discoverRouteFiles();
  const rel = full.map(stripPrefixToPagesDir);

  const routeInfos = buildRouteInfos(rel);
  if (routeInfos.length === 0) {
    console.warn('⚠️  No route files found.');
    return;
  }

  const { layouts, pages, groups } = groupPagesUnderLayouts(routeInfos);
  const code = generateCode(layouts, pages, groups);

  await ensureOutputDirExists();
  await Bun.write(OUTPUT_FILE, code);

  console.log(`✅ Generated ${OUTPUT_FILE}`);
  console.log(
    `📦 route files=${routeInfos.length} layouts=${layouts.length} pages=${pages.length}`,
  );

  console.log('Generated pages:');
  for (const p of [...pages].sort((a, b) => a.routePath.localeCompare(b.routePath))) {
    const icon = p.isCatchAll ? '🌐' : p.isDynamic ? '🔗' : '📄';
    console.log(`  ${icon} ${p.routePath.padEnd(28)} → ${p.filePath}`);
  }
}

await generateRoutes();

if (process.argv.includes('--watch')) {
  console.log(`\n👀 Watching ${PAGES_DIR} (polling with Bun.Glob) ...`);

  let lastFingerprint = await computeRoutesFingerprint();

  // Keep the "only one run at a time" behavior (similar to your debounce scheduler).
  let running = false;
  let rerunRequested = false;

  const runOnce = async () => {
    if (running) {
      rerunRequested = true;
      return;
    }
    running = true;
    try {
      await generateRoutes();
    } catch (e) {
      console.error('❌ Error generating routes:', e);
    } finally {
      running = false;
      if (rerunRequested) {
        rerunRequested = false;
        await runOnce();
      }
    }
  };

  // Polling interval (ms)
  const intervalMs = 250;

  // Allow clean exit on Ctrl+C
  let shouldStop = false;
  process.on('SIGINT', () => {
    shouldStop = true;
    process.exit(0);
  });

  while (!shouldStop) {
    await Bun.sleep(intervalMs);

    try {
      const next = await computeRoutesFingerprint();
      if (next !== lastFingerprint) {
        lastFingerprint = next;
        console.log('\n🔄 Change detected, regenerating...');
        await runOnce();
      }
    } catch (e) {
      console.error('❌ Watch loop error:', e);
    }
  }
}
