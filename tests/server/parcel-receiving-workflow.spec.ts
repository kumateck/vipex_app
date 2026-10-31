import { afterAll, beforeAll, beforeEach, describe } from 'bun:test';
import { closeSql } from '@/db/config';
import { createReceivingWorkflowFixture } from '../utils/receiving-workflow-fixture';
import { registerArrivalCases } from '../utils/receiving-workflow-cases/arrival';
import { registerLocationCases } from '../utils/receiving-workflow-cases/location';
import { registerConsignmentCases } from '../utils/receiving-workflow-cases/consignment';

describe.skipIf(process.env.RECEIVING_WORKFLOW_TEST !== '1')(
  'receiving workflow regression protection',
  () => {
    let fixture: Awaited<ReturnType<typeof createReceivingWorkflowFixture>>;
    beforeAll(async () => {
      fixture = await createReceivingWorkflowFixture();
    });
    beforeEach(async () => {
      await fixture.reset();
    });
    afterAll(async () => {
      await fixture?.cleanup();
      await closeSql();
    });
    const current = () => fixture;
    registerArrivalCases(current);
    registerLocationCases(current);
    registerConsignmentCases(current);
  },
);
