import type { ContactOutcome } from '../components/parcel-status/types';

type BulkOutcomeInput = { parcelIds: string[]; outcome: ContactOutcome; sendSms: boolean };
type SavedOutcome = { parcelIds: string[]; updatedCount: number; status: number };
type SmsRequest = {
  parcelId: string;
  outcome: ContactOutcome;
  sendSms: true;
  sendEmail: false;
  includeSecondReceiver: false;
};
type SmsResult = { sentCount: number; failedCount: number };
export type BulkOutcomeSmsSummary = SmsResult & { skippedCount: number; failedParcelIds: string[] };

type Notify = (input: SmsRequest) => Promise<SmsResult>;

async function notifyParcel(notify: Notify, parcelId: string, outcome: ContactOutcome) {
  try {
    const result = await notify({
      parcelId,
      outcome,
      sendSms: true,
      sendEmail: false,
      includeSecondReceiver: false,
    });
    return {
      ...result,
      skippedCount: result.sentCount === 0 && result.failedCount === 0 ? 1 : 0,
      failedParcelIds: result.failedCount > 0 ? [parcelId] : [],
    };
  } catch {
    // A failed/unknown dispatch must not undo an outcome or be retried automatically.
    return { sentCount: 0, failedCount: 1, skippedCount: 0, failedParcelIds: [parcelId] };
  }
}

async function sendOutcomeSms(parcelIds: string[], outcome: ContactOutcome, notify: Notify) {
  const summary: BulkOutcomeSmsSummary = {
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    failedParcelIds: [],
  };
  // Bound provider/API pressure while continuing after an individual recipient fails.
  for (let offset = 0; offset < parcelIds.length; offset += 4) {
    const results = await Promise.all(
      parcelIds.slice(offset, offset + 4).map((id) => notifyParcel(notify, id, outcome)),
    );
    for (const result of results) {
      summary.sentCount += result.sentCount;
      summary.failedCount += result.failedCount;
      summary.skippedCount += result.skippedCount;
      summary.failedParcelIds.push(...result.failedParcelIds);
    }
  }
  return summary;
}

export async function saveBulkCallOutcomeWithSms(
  input: BulkOutcomeInput,
  save: (input: Omit<BulkOutcomeInput, 'sendSms'>) => Promise<SavedOutcome>,
  notify: Notify,
) {
  const saved = await save({ parcelIds: input.parcelIds, outcome: input.outcome });
  const sms = input.sendSms ? await sendOutcomeSms(saved.parcelIds, input.outcome, notify) : null;
  return { saved, sms };
}
