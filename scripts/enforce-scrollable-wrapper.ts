import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOTS = [path.join('src', 'pages'), path.join('src', 'features')];
const LONG_PAGE_LINE_THRESHOLD = 180;

async function walkTsxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const next = path.join(dir, entry.name);
      if (entry.isDirectory()) return walkTsxFiles(next);
      if (entry.isFile() && entry.name.endsWith('.tsx')) return [next];
      return [];
    }),
  );
  return files.flat();
}

function toPosix(value: string) {
  return value.split(path.sep).join('/');
}

function isRoutePageFile(filePath: string) {
  const posix = toPosix(filePath);
  return posix.endsWith('/page.tsx') || /\/pages\/.+\.tsx$/.test(posix);
}

function isSharedHelperPageFile(filePath: string) {
  const posix = toPosix(filePath);
  return posix.endsWith('-shared.tsx');
}

function isScrollableWrapperExemptFile(filePath: string) {
  const posix = toPosix(filePath);
  return posix.endsWith('/communication/pages/communication-chat-thread-detail-page.tsx');
}

async function main() {
  const files = (await Promise.all(ROOTS.map((root) => walkTsxFiles(root)))).flat();
  const violations: string[] = [];

  for (const file of files) {
    if (!isRoutePageFile(file)) continue;
    if (isSharedHelperPageFile(file)) continue;
    if (isScrollableWrapperExemptFile(file)) continue;

    const code = await readFile(file, 'utf8');
    const lineCount = code.split('\n').length;
    if (lineCount < LONG_PAGE_LINE_THRESHOLD) continue;

    if (!code.includes('ScrollableWrapper')) {
      violations.push(`${toPosix(file)} (${lineCount} lines)`);
    }
  }

  if (violations.length > 0) {
    console.error('ScrollableWrapper check failed:\n');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    console.error(
      `\nEach long page (${LONG_PAGE_LINE_THRESHOLD}+ lines) must include ScrollableWrapper.`,
    );
    process.exit(1);
  }

  console.log(
    `ScrollableWrapper check passed. All route pages with ${LONG_PAGE_LINE_THRESHOLD}+ lines include ScrollableWrapper.`,
  );
}

await main();
