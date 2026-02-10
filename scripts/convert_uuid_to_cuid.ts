#!/usr/bin/env bun

/**
 * Convert foreign key UUID columns to varchar(25) to match CUID primary keys
 * Preserves created_by, updated_by as UUID
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Directory containing your schema files
const SCHEMA_DIR = './src/db/schemas'; // Adjust this path as needed

function convertFile(filePath: string): number {
  const originalContent = readFileSync(filePath, 'utf-8');
  let content = originalContent;
  let changes = 0;

  // Match ALL uuid('column_name') patterns and extract the column name
  const uuidPattern = /uuid\(\s*(['"`])([a-z_]+)\1\s*\)/gi;

  const replacedFields = new Set<string>();
  content = content.replace(uuidPattern, (match, quote, columnName) => {
    changes++;
    replacedFields.add(columnName);
    return `varchar('${columnName}', { length: 25 })`;
  });

  // Log what was changed
  if (replacedFields.size > 0) {
    replacedFields.forEach((field) => {
      console.log(`  ✓ ${field}`);
    });
  }

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
  }

  return changes;
}

// Main execution
console.log('🔄 Converting foreign key UUIDs to varchar(25)...\n');

try {
  const files = readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.ts'));
  let totalChanges = 0;

  for (const file of files) {
    const filePath = join(SCHEMA_DIR, file);
    console.log(`📄 ${file}`);
    const changes = convertFile(filePath);
    totalChanges += changes;

    if (changes === 0) {
      console.log('  (no changes)');
    }
    console.log();
  }

  console.log('='.repeat(50));
  console.log(`✨ Complete! Total changes: ${totalChanges}`);
  console.log('='.repeat(50));
  console.log('\n📋 Next steps:');
  console.log('  1. Review changes: git diff');
  console.log('  2. Delete old migrations: rm drizzle/*.sql');
  console.log('  3. Generate: bun generate');
  console.log('  4. Migrate: bun migrate');
} catch (error) {
  console.error('❌ Error:', error);
  console.log('\n💡 Make sure SCHEMA_DIR path is correct in the script');
  process.exit(1);
}
