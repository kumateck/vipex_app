import './otp-client-mocks';
import { beforeEach, describe, expect, test } from 'bun:test';
import { act } from 'react-test-renderer';
import { renderHook } from './render-hook';
import { resetOtpTransport, sends, setSessionLoader, verifications } from './otp-client-transport';
import type { ParcelSearchRow } from '@/features/operations/parcel/api/parcel.api';
import type { PickupParcel } from '@mobile/features/operations/office-pickup/types';
import type { ReceiverOtpSession } from '@/shared/shipments/receiver-otp-session';

const { useWaitingPickupDialogState } = await import(
  '@/features/operations/parcel/components/parcel-waiting-pickup/use-waiting-pickup-dialog-state'
);
const { useReceiverCashierDialogState } = await import(
  '@/features/operations/parcel/components/parcel-receiver-cashier/use-receiver-cashier-dialog-state'
);
const { useOfficePickupHandover } = await import(
  '@mobile/features/operations/office-pickup/hooks/use-office-pickup-handover'
);

const parcel = (id: string) =>
  ({
    id,
    receiverId: `customer-${id}`,
    receiverPhone: '0245555555',
    receiverPhone2: '0246666666',
    plannedToBePaidPsw: 0,
  }) as ParcelSearchRow & PickupParcel;
beforeEach(resetOtpTransport);

describe('web OTP reopening', () => {
  for (const [name, useDialog] of [
    ['Waiting for Pickup', useWaitingPickupDialogState],
    ['Receiver Cashier', useReceiverCashierDialogState],
  ] as const) {
    test(`${name} restores A after working on B and resumes verification without resending`, async () => {
      const view = await renderHook(() => useDialog());
      try {
        await act(async () => {
          view.current.openParcelDialog(parcel('a'));
        });
        await act(async () => {
          view.current.setPhoneSlot('secondary');
          view.current.otp.setOtpChannel('whatsapp');
        });
        await act(async () => {
          await view.current.otp.request();
        });
        const expiry = view.current.otp.otpExpiresAt;
        await act(async () => {
          if ('closeParcelDialog' in view.current) view.current.closeParcelDialog();
          else view.current.setSelectedParcel(null);
          view.current.openParcelDialog(parcel('b'));
        });
        expect(view.current.otp.otpSentAt).toBeNull();
        await act(async () => {
          view.current.otp.setOtpChannel('sms');
        });
        await act(async () => {
          await view.current.otp.request();
        });
        await act(async () => {
          view.current.openParcelDialog(parcel('a'));
        });
        expect(view.current.otp.otpSentAt).toBeTruthy();
        expect(view.current.otp.otpExpiresAt).toBe(expiry);
        expect(view.current.phoneSlot).toBe('secondary');
        expect(view.current.otp.otpChannel).toBe('whatsapp');
        await act(async () => {
          view.current.otp.setOtpCode('123456');
        });
        await act(async () => {
          await view.current.otp.verify();
        });
        expect(view.current.otp.verificationToken).toBe('proof-a');
        await act(async () => {
          view.current.openParcelDialog(parcel('b'));
        });
        await act(async () => {
          view.current.openParcelDialog(parcel('a'));
        });
        expect(view.current.otp.otpVerified).toBe(true);
        expect(view.current.otp.verificationToken).toBe('proof-a');
        expect(sends).toEqual(['a', 'b']);
        expect(verifications).toEqual(['a']);
      } finally {
        await view.unmount();
      }
    });
    test(`${name} ignores a delayed restore for A after B opens`, async () => {
      const view = await renderHook(() => useDialog());
      let release!: (value: ReceiverOtpSession | null) => void;
      const delayed = new Promise<ReceiverOtpSession | null>((resolve) => {
        release = resolve;
      });
      setSessionLoader((id) => (id === 'a' ? delayed : Promise.resolve(null)));
      try {
        await act(async () => {
          view.current.openParcelDialog(parcel('a'));
        });
        await act(async () => {
          view.current.openParcelDialog(parcel('b'));
        });
        await act(async () => {
          release({
            sentAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 600000).toISOString(),
            channel: 'whatsapp',
            phoneSlot: 'secondary',
            verificationToken: 'proof-a',
          });
        });
        expect(view.current.selectedParcel?.id).toBe('b');
        expect(view.current.otp.otpSentAt).toBeNull();
        expect(view.current.otp.verificationToken).toBe('');
        expect(view.current.phoneSlot).toBe('primary');
      } finally {
        await view.unmount();
      }
    });
  }
});

const mobileOptions = {
  context: { companyId: 'company', branchId: 'accra', locationId: 'circle' },
  isPickupOtpRequired: true,
  isPickupQueueEnabled: false,
  isWhatsAppAvailable: true,
  onFinished: () => {},
};

describe('mobile OTP reopening', () => {
  test('preserves the sent code step across parcels and restores verified proof', async () => {
    const view = await renderHook(() => useOfficePickupHandover(mobileOptions as never));
    try {
      await act(async () => {
        await view.current.open(parcel('a'));
      });
      await act(async () => {
        view.current.setPhoneSlot('secondary');
        view.current.otp.setChannel('whatsapp');
      });
      await act(async () => {
        await view.current.otp.request();
      });
      const expiry = view.current.otp.expiresAt;
      await act(async () => {
        view.current.close();
      });
      await act(async () => {
        await view.current.open(parcel('b'));
      });
      expect(view.current.otp.sentAt).toBeNull();
      await act(async () => {
        view.current.otp.setChannel('sms');
      });
      await act(async () => {
        await view.current.otp.request();
      });
      await act(async () => {
        await view.current.open(parcel('a'));
      });
      expect(view.current.otp.sentAt).toBeTruthy();
      expect(view.current.otp.expiresAt).toBe(expiry);
      expect(view.current.phoneSlot).toBe('secondary');
      expect(view.current.otp.channel).toBe('whatsapp');
      await act(async () => {
        view.current.otp.setCode('123456');
      });
      await act(async () => {
        await view.current.otp.verify();
      });
      await act(async () => {
        view.current.close();
      });
      await act(async () => {
        await view.current.open(parcel('a'));
      });
      expect(view.current.otp.verified).toBe(true);
      expect(view.current.otp.verificationToken).toBe('proof-a');
      expect(sends).toEqual(['a', 'b']);
      expect(verifications).toEqual(['a']);
    } finally {
      await view.unmount();
    }
  });
  test('a delayed status response cannot restore another parcel’s token or phone choice', async () => {
    const view = await renderHook(() => useOfficePickupHandover(mobileOptions as never));
    let release!: (value: ReceiverOtpSession | null) => void;
    const delayed = new Promise<ReceiverOtpSession | null>((resolve) => {
      release = resolve;
    });
    setSessionLoader((id) => (id === 'a' ? delayed : Promise.resolve(null)));
    try {
      await act(async () => {
        await view.current.open(parcel('a'));
      });
      await act(async () => {
        view.current.close();
        await view.current.open(parcel('b'));
      });
      await act(async () => {
        release({
          sentAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 600000).toISOString(),
          channel: 'sms',
          phoneSlot: 'secondary',
          verificationToken: 'proof-a',
        });
      });
      expect(view.current.parcel?.id).toBe('b');
      expect(view.current.otp.verificationToken).toBe('');
      expect(view.current.phoneSlot).toBe('primary');
    } finally {
      await view.unmount();
    }
  });
});
