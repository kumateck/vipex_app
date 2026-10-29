import { afterAll, beforeAll, beforeEach, describe } from 'bun:test';
import { closeSql } from '@/db/config';
import { createChargeApprovalFixture } from '../utils/charge-approval-fixture';
import { registerChargeWorkflowCases } from '../utils/charge-approval-cases/workflow';
import { registerChargeValidationCases } from '../utils/charge-approval-cases/validation';

describe.skipIf(process.env.CHARGE_APPROVAL_TEST !== '1')(
  'zero-charge correction approvals on isolated PostgreSQL',
  () => {
    let fixture: Awaited<ReturnType<typeof createChargeApprovalFixture>>;
    beforeAll(async () => {
      fixture = await createChargeApprovalFixture();
    });
    beforeEach(async () => {
      await fixture.reset();
    });
    afterAll(async () => {
      await fixture?.cleanup();
      await closeSql();
    });
    const current = () => fixture;
    registerChargeWorkflowCases(current);
    registerChargeValidationCases(current);
  },
);
