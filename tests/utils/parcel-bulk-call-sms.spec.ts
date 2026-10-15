import { describe, expect, mock, test } from 'bun:test';
import { saveBulkCallOutcomeWithSms } from '@/features/operations/parcel/services/bulk-call-outcome';

const input = { parcelIds: ['parcel-a', 'parcel-b'], outcome: 'pickup' as const, sendSms: true };
const saved = { parcelIds: input.parcelIds, updatedCount: 2, status: 5 };

describe('bulk call outcome SMS', () => {
  test('saves the batch first and reuses the single SMS request for each saved parcel', async () => {
    const events: string[] = [];
    const save = mock(async () => {
      events.push('saved');
      return saved;
    });
    const notify = mock(async (request: { parcelId: string }) => {
      events.push(request.parcelId);
      return { sentCount: 1, failedCount: 0 };
    });
    const result = await saveBulkCallOutcomeWithSms(input, save, notify);
    expect(save).toHaveBeenCalledWith({ parcelIds: input.parcelIds, outcome: 'pickup' });
    expect(events).toEqual(['saved', 'parcel-a', 'parcel-b']);
    expect(notify).toHaveBeenCalledTimes(2);
    for (const parcelId of input.parcelIds)
      expect(notify).toHaveBeenCalledWith({
        parcelId,
        outcome: 'pickup',
        sendSms: true,
        sendEmail: false,
        includeSecondReceiver: false,
      });
    expect(result).toEqual({
      saved,
      sms: {
        sentCount: 2,
        failedCount: 0,
        skippedCount: 0,
        failedParcelIds: [],
      },
    });
  });

  test('does not dispatch when SMS is unchecked', async () => {
    const notify = mock(async () => ({ sentCount: 1, failedCount: 0 }));
    const result = await saveBulkCallOutcomeWithSms(
      { ...input, sendSms: false },
      async () => saved,
      notify,
    );
    expect(result.sms).toBeNull();
    expect(notify).not.toHaveBeenCalled();
  });

  test('invalid or stale batches send no notifications', async () => {
    const notify = mock(async () => ({ sentCount: 1, failedCount: 0 }));
    await expect(
      saveBulkCallOutcomeWithSms(
        input,
        async () => {
          throw new Error('Parcel was reassigned');
        },
        notify,
      ),
    ).rejects.toThrow('Parcel was reassigned');
    expect(notify).not.toHaveBeenCalled();
  });

  test('keeps saved outcomes and continues after failed, skipped and unknown SMS dispatches', async () => {
    const parcelIds = ['sent', 'rejected', 'missing-phone', 'unknown', 'last'];
    const save = mock(async () => ({ ...saved, parcelIds, updatedCount: 5 }));
    const notify = mock(async ({ parcelId }: { parcelId: string }) => {
      if (parcelId === 'unknown') throw new Error('Response lost');
      if (parcelId === 'missing-phone') return { sentCount: 0, failedCount: 0 };
      if (parcelId === 'rejected') return { sentCount: 0, failedCount: 1 };
      return { sentCount: 1, failedCount: 0 };
    });
    const result = await saveBulkCallOutcomeWithSms({ ...input, parcelIds }, save, notify);
    expect(save).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(5);
    expect(result.saved.updatedCount).toBe(5);
    expect(result.sms).toEqual({
      sentCount: 2,
      failedCount: 2,
      skippedCount: 1,
      failedParcelIds: ['rejected', 'unknown'],
    });
  });

  test('uses only server-confirmed parcel IDs and forwards each outcome unchanged', async () => {
    for (const outcome of ['follow_up', 'pickup', 'delivery'] as const) {
      const notify = mock(async () => ({ sentCount: 1, failedCount: 0 }));
      await saveBulkCallOutcomeWithSms(
        { ...input, outcome },
        async () => ({ ...saved, parcelIds: ['parcel-b'] }),
        notify,
      );
      expect(notify).toHaveBeenCalledTimes(1);
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ parcelId: 'parcel-b', outcome }),
      );
    }
  });

  test('limits concurrent notification requests to four for a full batch', async () => {
    const parcelIds = Array.from({ length: 100 }, (_, i) => `parcel-${i}`);
    let active = 0;
    let peak = 0;
    const notify = mock(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return { sentCount: 1, failedCount: 0 };
    });
    const result = await saveBulkCallOutcomeWithSms(
      { ...input, parcelIds },
      async () => ({ ...saved, parcelIds, updatedCount: 100 }),
      notify,
    );
    expect(peak).toBe(4);
    expect(notify).toHaveBeenCalledTimes(100);
    expect(result.sms?.sentCount).toBe(100);
  });
});
