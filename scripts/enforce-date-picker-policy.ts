import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOTS = [
  path.join('src', 'pages'),
  path.join('src', 'features'),
  path.join('src', 'components'),
];

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

async function main() {
  const files = (await Promise.all(ROOTS.map((root) => walkTsxFiles(root)))).flat();
  const violations: string[] = [];

  const patterns = [
    { label: 'type="date"', regex: /type\s*=\s*['"]date['"]/g },
    { label: 'type="datetime-local"', regex: /type\s*=\s*['"]datetime-local['"]/g },
  ];

  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const lines = code.split('\n');

    for (const pattern of patterns) {
      for (const match of code.matchAll(pattern.regex)) {
        const index = match.index ?? 0;
        const lineNumber = code.slice(0, index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() ?? '';
        violations.push(`${toPosix(file)}:${lineNumber} (${pattern.label}) ${lineContent}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('Date picker policy check failed:\n');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    console.error(
      '\nNative date inputs are not allowed. Use DatePicker, DateTimePicker, or DateRangePicker from src/components/ui.',
    );
    process.exit(1);
  }

  console.log('Date picker policy check passed. No native date/datetime-local inputs found.');
}

await main();
