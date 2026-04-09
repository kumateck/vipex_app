import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_LINES = 300;
const EXEMPTIONS_FILE = path.join('scripts', 'file-size-exemptions.txt');
const ROOT_DIR = '.';

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.turbo',
  '.vercel',
  '.next',
  '.expo',
  'coverage',
]);

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function toPosix(value: string) {
  return value.split(path.sep).join('/');
}

async function walkCodeFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const next = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) return [];
        return walkCodeFiles(next);
      }

      if (!entry.isFile()) return [];

      const ext = path.extname(entry.name);
      if (!EXTENSIONS.has(ext)) return [];

      return [toPosix(next)];
    }),
  );

  return files.flat();
}

function parseExemptions(content: string) {
  const set = new Set<string>();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    set.add(line);
  }
  return set;
}

function lineCount(source: string) {
  if (source.length === 0) return 0;
  return source.split(/\r?\n/).length;
}

async function main() {
  const [allFiles, exemptionsRaw] = await Promise.all([
    walkCodeFiles(ROOT_DIR),
    readFile(EXEMPTIONS_FILE, 'utf8'),
  ]);

  const exemptions = parseExemptions(exemptionsRaw);

  const violations: Array<{ file: string; lines: number }> = [];
  const oversizedExemptions: Array<{ file: string; lines: number }> = [];

  for (const file of allFiles.sort()) {
    const source = await readFile(file, 'utf8');
    const lines = lineCount(source);
    if (lines <= MAX_LINES) continue;

    if (exemptions.has(file)) {
      oversizedExemptions.push({ file, lines });
      continue;
    }

    violations.push({ file, lines });
  }

  if (violations.length > 0) {
    console.error(
      `File size check failed: files must stay <= ${MAX_LINES} lines unless approved in ${toPosix(EXEMPTIONS_FILE)}.\n`,
    );
    for (const violation of violations) {
      console.error(`- ${violation.file} (${violation.lines} lines)`);
    }

    process.exit(1);
  }

  const summaryPrefix = `File size check passed. MAX=${MAX_LINES}.`;
  if (oversizedExemptions.length > 0) {
    console.log(
      `${summaryPrefix} ${oversizedExemptions.length} approved exemption(s) currently exceed limit (${toPosix(EXEMPTIONS_FILE)}).`,
    );
    return;
  }

  console.log(`${summaryPrefix} No files exceed the limit.`);
}

await main();
