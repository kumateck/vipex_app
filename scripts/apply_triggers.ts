import { sql, closeSql } from '../src/db/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

try {
  // Hide NOTICE messages for this session
  await sql`set client_min_messages = warning`;

  const sqlText = await readFile(resolve('scripts/updated_at_triggers.sql'), 'utf8');
  await sql.unsafe(sqlText);
  console.log('updated_at triggers installed successfully');
} catch (err) {
  console.error('Error installing triggers:', err);
  process.exitCode = 1;
} finally {
  await closeSql();
}
