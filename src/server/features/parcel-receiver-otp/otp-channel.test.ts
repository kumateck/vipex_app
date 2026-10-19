import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import * as parcels from '../shipments/parcels.service';
import * as availability from '../whatsapp-messaging/availability.service';
import * as repository from './repository';
import { requestReceiverOtpSvc } from './service';

const restorations: Array<() => void> = [];
afterEach(() => {
  for (const restore of restorations.splice(0).reverse()) restore();
});

function arrange(state: { moduleEnabled: boolean; configured: boolean }) {
  const parcel = spyOn(parcels, 'getParcelSvc').mockResolvedValue({
    status: ParcelStatus.AWAITING_PICKUP,
  } as never);
  const whatsapp = spyOn(availability, 'getWhatsAppAvailabilitySvc').mockResolvedValue({
    ...state,
    available: state.moduleEnabled && state.configured,
  });
  const create = spyOn(repository, 'createParcelReceiverOtpRepo').mockResolvedValue(null);
  restorations.push(
    () => parcel.mockRestore(),
    () => whatsapp.mockRestore(),
    () => create.mockRestore(),
  );
  return { create };
}

const request = {
  companyId: 'company',
  branchId: 'branch',
  parcelId: 'parcel',
  targetReceiver: 'main' as const,
  requestedBy: 'user',
  channel: 'whatsapp' as const,
};

describe('receiver OTP channel choice', () => {
  test('refuses WhatsApp when the module is disabled, before creating a code', async () => {
    const { create } = arrange({ moduleEnabled: false, configured: true });
    await expect(requestReceiverOtpSvc(request)).rejects.toMatchObject({
      status: 400,
      message: 'WhatsApp Messaging is not enabled for this company',
    });
    expect(create).not.toHaveBeenCalled();
  });

  test('refuses WhatsApp when the provider is not configured', async () => {
    const { create } = arrange({ moduleEnabled: true, configured: false });
    await expect(requestReceiverOtpSvc(request)).rejects.toMatchObject({ status: 400 });
    expect(create).not.toHaveBeenCalled();
  });
});
