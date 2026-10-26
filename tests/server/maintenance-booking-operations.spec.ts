import { afterAll, beforeAll, beforeEach, describe } from 'bun:test';
import { closeSql } from '@/db/config';
import { createMaintenanceBookingFixture } from '../utils/maintenance-booking-fixture';
import { registerBalanceCases } from '../utils/maintenance-booking-cases/balances';
import { registerNameCases } from '../utils/maintenance-booking-cases/names';
import { registerRecipientCases } from '../utils/maintenance-booking-cases/recipient';
import { registerInspectionCases } from '../utils/maintenance-booking-cases/inspections';

describe.skipIf(process.env.MAINTENANCE_BOOKING_TEST !== '1')(
  'booking-code maintenance operations on isolated PostgreSQL',
  () => {
    let fixture: Awaited<ReturnType<typeof createMaintenanceBookingFixture>>;
    beforeAll(async () => {
      fixture = await createMaintenanceBookingFixture();
    });
    beforeEach(async () => {
      await fixture.reset();
    });
    afterAll(async () => {
      await fixture?.cleanup();
      await closeSql();
    });
    const current = () => fixture;
    registerBalanceCases(current);
    registerNameCases(current);
    registerRecipientCases(current);
    registerInspectionCases(current);
  },
);
