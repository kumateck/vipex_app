import 'dotenv/config';
import { Pool } from 'pg';

async function migrateAudit() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });

  console.log('🚀 Running migration: add audit_logs table...\n');

  try {
    await pool.query('BEGIN');

    await pool.query(`
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
    console.log('✅ Ensured table audit_logs exists');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS audit_logs_company_idx ON audit_logs(company_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at)
    `);
    console.log('✅ Ensured audit indexes exist');

    // Optional foreign keys added defensively (only if they don't already exist)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'audit_logs_company_fk'
        ) THEN
          ALTER TABLE audit_logs
            ADD CONSTRAINT audit_logs_company_fk
            FOREIGN KEY (company_id) REFERENCES companies(id);
        END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'audit_logs_actor_user_fk'
        ) THEN
          ALTER TABLE audit_logs
            ADD CONSTRAINT audit_logs_actor_user_fk
            FOREIGN KEY (actor_user_id) REFERENCES users(id);
        END IF;
      END $$;
    `);

    console.log('✅ Ensured audit foreign keys exist');

    await pool.query('COMMIT');

    console.log('\n════════════════════════════════════════');
    console.log('🎉 Audit migration completed successfully!');
    console.log('════════════════════════════════════════\n');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Audit migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateAudit()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
