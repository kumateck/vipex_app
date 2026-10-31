import {
  repairBookingBalance,
  backfillBookingNames,
  repairReversedRecipientPayments,
  checkBookingSearch,
  inspectClearedDeliveryFee,
} from './booking-operations';
import {
  MAINTENANCE_SCRIPTS,
  type MaintenanceParams,
  type MaintenanceResult,
  type MaintenanceScriptId,
} from '@/shared/maintenance';
import { executeCreditPrintRepair, type TaggedTransaction } from './credit-repair';
import { scanCreditConflicts, traceCreditParcel } from './parcel-inspection';
import { repairReceivingWorkflow } from './receiving-workflow';

export async function runRegisteredScript(
  tx: TaggedTransaction,
  input: {
    operationId: MaintenanceScriptId;
    params: MaintenanceParams;
    companyId: string;
    actorId: string;
    apply: boolean;
  },
): Promise<MaintenanceResult> {
  const code = String(input.params.bookingCode ?? '');
  const operation = {
    companyId: input.companyId,
    actorId: input.actorId,
    code,
    apply: input.apply,
  };
  switch (input.operationId) {
    case 'repair-parcel-receiving-workflow':
      return repairReceivingWorkflow(tx, {
        ...operation,
        pickupLocationId: String(input.params.pickupLocationId ?? '') || undefined,
      });
    case 'check-parcel-booking-search':
      return checkBookingSearch(tx, operation);
    case 'inspect-cleared-delivery-fee':
      return inspectClearedDeliveryFee(tx, operation);
    case 'backfill-parcel-customer-names':
      return backfillBookingNames(tx, operation);
    case 'restore-reversed-parcel-balance':
      return repairBookingBalance(tx, operation, true);
    case 'fix-reversed-booking-to-be-paid':
      return repairReversedRecipientPayments(tx, operation);
    case 'repair-parcel-financial-state':
      return repairBookingBalance(tx, operation);
    case 'trace-credit-parcel': {
      const details = await traceCreditParcel(tx, code, input.companyId);
      return {
        summary: `Found ${details.reports.length} parcel record(s).`,
        details,
        readyToApply: false,
      };
    }
    case 'scan-credit-conflicts': {
      const details = await scanCreditConflicts(tx, input.companyId, code || undefined);
      return {
        summary: `Found ${details.candidates[0]?.total_candidates ?? 0} credit and cash conflict(s). Showing up to 200.`,
        details,
        readyToApply: false,
      };
    }
    case 'repair-credit-print-payment': {
      const report = await executeCreditPrintRepair(tx, {
        code,
        companyId: input.companyId,
        actorId: input.actorId,
        apply: input.apply,
        reason:
          'System Admin confirmed printing created this cash payment and no cash was received.',
        executionSource: 'maintenance-ui',
      });
      const amount = (report.voidAmountPsw / 100).toFixed(2);
      const summary =
        report.status === 'repaired'
          ? `Voided GHS ${amount}. The original credit charge is retained.`
          : report.status === 'already-repaired'
            ? 'This payment has already been repaired.'
            : `Ready to void GHS ${amount} and exclude its unfiled tax entries. The credit charge will be retained.`;
      return { summary, details: report, readyToApply: report.status === 'ready' };
    }
  }
}

export const getMaintenanceCatalog = () => MAINTENANCE_SCRIPTS;
