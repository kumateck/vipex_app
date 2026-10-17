import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { sha256HexAsync } from '@/server/utils/otp';
import * as modules from '../company-modules/repository';
import * as documents from './receipt-document.service';
import * as repository from './repository';
import { getPublicReceiptSvc } from './public.service';

const token = 'ab'.repeat(32);
const restorations: Array<() => void> = [];
afterEach(() => {
  for (const restore of restorations.splice(0).reverse()) restore();
});
function spy<T extends object, K extends keyof T>(target: T, key: K) {
  const s = spyOn(target, key as never);
  restorations.push(() => s.mockRestore());
  return s;
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: 'link',
    companyId: 'company',
    parcelId: 'parcel',
    kind: 'booking',
    paymentId: null,
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 60_000),
    viewCount: 0,
    lastViewedAt: null,
    createdBy: null,
    createdAt: new Date('2026-10-16T10:00:00Z'),
    ...overrides,
  };
}

describe('public receipt link', () => {
  test('rejects malformed tokens without a lookup', async () => {
    const find = spy(repository, 'findReceiptShareLinkByTokenHashRepo');
    await expect(getPublicReceiptSvc('not-a-token')).rejects.toMatchObject({ status: 404 });
    expect(find).not.toHaveBeenCalled();
  });

  test('looks the link up by the sha256 of the token, never the token itself', async () => {
    const find = spy(repository, 'findReceiptShareLinkByTokenHashRepo').mockResolvedValue(null);
    await expect(getPublicReceiptSvc(token)).rejects.toMatchObject({ status: 404 });
    expect(find).toHaveBeenCalledWith(await sha256HexAsync(token));
  });

  test('treats an expired link as not found', async () => {
    spy(repository, 'findReceiptShareLinkByTokenHashRepo').mockResolvedValue(
      link({ expiresAt: new Date(Date.now() - 1) }) as never,
    );
    await expect(getPublicReceiptSvc(token)).rejects.toMatchObject({ status: 404 });
  });

  test('treats a link as not found once the module is disabled', async () => {
    spy(repository, 'findReceiptShareLinkByTokenHashRepo').mockResolvedValue(link() as never);
    spy(modules, 'findCompanyModuleRepo').mockResolvedValue({ isEnabled: false } as never);
    await expect(getPublicReceiptSvc(token)).rejects.toMatchObject({ status: 404 });
  });

  test('returns the rendered receipt and records the view', async () => {
    spy(repository, 'findReceiptShareLinkByTokenHashRepo').mockResolvedValue(link() as never);
    spy(modules, 'findCompanyModuleRepo').mockResolvedValue({ isEnabled: true } as never);
    const view = spy(repository, 'recordReceiptShareLinkViewRepo').mockResolvedValue(undefined);
    spy(documents, 'buildReceiptSvc').mockResolvedValue({
      kind: 'booking',
      bookingCode: 'BK-1',
      issuedAt: '2026-10-16T10:00:00.000Z',
      summary: {
        amountPaidCedis: 40,
        balanceCedis: 0,
        destinationBranch: 'Kumasi',
        destinationLocation: 'Adum',
      },
      document: {
        template: 'home-delivery-a5',
        props: {
          issuedAtLabel: 'x',
          bookingCode: 'BK-1',
          trackingCode: 'T',
          senderName: 'A',
          senderPhone: '',
          receiverName: 'B',
          receiverPhone: '',
          parcelDetails: '',
          parcelContent: '',
          destinationName: '',
          dropoffAddress: '',
          chargePsw: 0,
          deliveryFeePsw: 0,
          paidPrincipalPsw: 0,
          paidDeliveryFeePsw: 0,
          principalDuePsw: 0,
          deliveryFeeDuePsw: 0,
          totalDuePsw: 0,
          grossPsw: 0,
          netPsw: 0,
          taxRows: [],
          qrValue: 'q',
        },
      },
    });
    const result = await getPublicReceiptSvc(token);
    expect(result).toMatchObject({ kind: 'booking', bookingCode: 'BK-1' });
    expect(result.html).toContain('<!doctype html>');
    expect(view).toHaveBeenCalledWith('link');
  });
});
