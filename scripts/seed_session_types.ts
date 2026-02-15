import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/config';
import { users, cashierSessionTypes } from '@/db/schemas';

async function main() {
  const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);

  if (!firstUser) {
    console.error('No users found in database. Please seed users first.');
    process.exit(1);
  }

  const CREATED_BY = firstUser.id;
  console.log(`Using user ${CREATED_BY} as creator`);

  const sessionTypes = [
    { sessionType: '24-Hour', startTime: '00:00', endTime: '23:59', createdBy: CREATED_BY },
    { sessionType: 'Day Shift', startTime: '08:00', endTime: '17:00', createdBy: CREATED_BY },
    { sessionType: 'Night Shift', startTime: '17:00', endTime: '08:00', createdBy: CREATED_BY },
  ];

  for (const session of sessionTypes) {
    const existing = await db
      .select({ id: cashierSessionTypes.id })
      .from(cashierSessionTypes)
      .where(eq(cashierSessionTypes.sessionType, session.sessionType))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(cashierSessionTypes).values(session);
      console.log(`  ✓ Created session type: ${session.sessionType}`);
    } else {
      console.log(`  ✓ Session type already exists: ${session.sessionType}`);
    }
  }

  console.log('Seeded cashier_session_types.');
}

main().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
