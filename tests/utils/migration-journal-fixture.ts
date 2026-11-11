import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type JournalEntry = { tag: string; when: number };

/** Run the real registered migrations for the schema this historical fixture represents. */
export async function createMigrationJournalFixture(firstTag: string, lastTag = firstTag) {
  const journal = (await Bun.file('drizzle/meta/_journal.json').json()) as {
    entries: JournalEntry[];
  };
  const start = journal.entries.findIndex(({ tag }) => tag === firstTag);
  const end = journal.entries.findIndex(({ tag }) => tag === lastTag);
  if (start < 1 || end < start) throw new Error('Invalid migration fixture range');
  const previous = journal.entries[start - 1]!;
  const entries = journal.entries.slice(start, end + 1);
  const folder = await mkdtemp(join(tmpdir(), 'vipex-migration-journal-'));
  const cleanup = () => rm(folder, { recursive: true, force: true });
  try {
    await mkdir(join(folder, 'meta'));
    await Bun.write(join(folder, 'meta', '_journal.json'), JSON.stringify({ ...journal, entries }));
    await Promise.all(
      entries.map(({ tag }) =>
        Bun.write(join(folder, `${tag}.sql`), Bun.file(`drizzle/${tag}.sql`)),
      ),
    );
    return { folder, previous, entries, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
