import { sql } from '@/db/config';

let initialized = false;
let available = false;
let initPromise: Promise<boolean> | null = null;

async function initAuditStorage(): Promise<boolean> {
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id varchar(25) PRIMARY KEY,
        company_id varchar(25) NOT NULL,
        actor_user_id varchar(25),
        entity_type varchar(100) NOT NULL,
        entity_id varchar(25),
        action varchar(120) NOT NULL,
        message varchar(1000),
        metadata json,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS audit_logs_company_idx ON audit_logs(company_id)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at)
    `);

    available = true;
  } catch (error) {
    available = false;
    console.warn('audit-storage-unavailable', error);
  }

  initialized = true;
  return available;
}

export async function ensureAuditStorageReady(): Promise<boolean> {
  if (initialized) return available;
  if (!initPromise) {
    initPromise = initAuditStorage();
  }
  return initPromise;
}
