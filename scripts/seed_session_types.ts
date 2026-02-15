import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
const CREATED_BY = process.env.SESSION_TYPES_CREATED_BY; // CUID (<=25 chars) of a user to attribute seed rows

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

if (!CREATED_BY || !/^[A-Za-z0-9_-]{1,25}$/.test(CREATED_BY)) {
  console.error('SESSION_TYPES_CREATED_BY must be a valid user id (1-25 chars).');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

try {
  await sql.begin(async (tx) => {
    await tx`
      insert into cashier_session_types (session_type, start_time, end_time, created_by)
      values 
        ('24-Hour', '00:00', '23:59', ${CREATED_BY}),
        ('Day Shift', '08:00', '17:00', ${CREATED_BY}),
        ('Night Shift', '17:00', '08:00', ${CREATED_BY})
      on conflict (session_type) do nothing
    `;
  });
  console.log('Seeded cashier_session_types.');
} catch (err) {
  console.error('Seeding error:', err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
